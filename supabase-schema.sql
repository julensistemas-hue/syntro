-- =====================================================
-- ESQUEMA DE BASE DE DATOS PARA AULA VIRTUAL
-- AI Security - Curso Wazuh
-- =====================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: course_users
-- Usuarios matriculados en cursos
-- =====================================================
CREATE TABLE course_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_verified BOOLEAN DEFAULT FALSE,
  payment_method TEXT CHECK (payment_method IN ('stripe', 'transfer', 'bizum')),
  payment_reference TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsqueda por email
CREATE INDEX idx_course_users_email ON course_users(email);

-- =====================================================
-- TABLA: modules
-- Módulos del curso (ej: "Instalación", "Configuración ENS")
-- =====================================================
CREATE TABLE modules (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  order_index INT NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA: lessons
-- Lecciones/videos dentro de cada módulo
-- =====================================================
CREATE TABLE lessons (
  id SERIAL PRIMARY KEY,
  module_id INT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  video_type TEXT DEFAULT 'youtube' CHECK (video_type IN ('youtube', 'bunny', 'vimeo')),
  duration_minutes INT,
  order_index INT NOT NULL DEFAULT 0,
  resources JSONB DEFAULT '[]'::jsonb,
  text_content TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para ordenar lecciones por módulo
CREATE INDEX idx_lessons_module ON lessons(module_id, order_index);

-- =====================================================
-- TABLA: user_progress
-- Progreso del usuario en cada lección
-- =====================================================
CREATE TABLE user_progress (
  user_id UUID NOT NULL REFERENCES course_users(id) ON DELETE CASCADE,
  lesson_id INT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_watched_seconds INT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, lesson_id)
);

-- =====================================================
-- TABLA: comments
-- Comentarios/dudas de usuarios en lecciones
-- =====================================================
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES course_users(id) ON DELETE CASCADE,
  lesson_id INT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_resolved BOOLEAN DEFAULT FALSE,
  admin_reply TEXT,
  admin_replied_at TIMESTAMP WITH TIME ZONE
);

-- Índice para obtener comentarios por lección
CREATE INDEX idx_comments_lesson ON comments(lesson_id, created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE course_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS: course_users
-- =====================================================

-- Los usuarios solo pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON course_users FOR SELECT
  USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON course_users FOR UPDATE
  USING (auth.uid() = id);

-- Solo el servicio puede insertar nuevos usuarios
CREATE POLICY "Service role can insert users"
  ON course_users FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- POLÍTICAS: modules
-- =====================================================

-- Cualquier usuario autenticado puede ver módulos publicados
CREATE POLICY "Authenticated users can view published modules"
  ON modules FOR SELECT
  TO authenticated
  USING (is_published = true);

-- =====================================================
-- POLÍTICAS: lessons
-- =====================================================

-- Usuarios con pago verificado pueden ver lecciones publicadas
CREATE POLICY "Paid users can view published lessons"
  ON lessons FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM course_users
      WHERE course_users.id = auth.uid()
      AND course_users.payment_verified = true
    )
  );

-- =====================================================
-- POLÍTICAS: user_progress
-- =====================================================

-- Los usuarios pueden ver su propio progreso
CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden insertar su propio progreso
CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar su propio progreso
CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS: comments
-- =====================================================

-- Usuarios autenticados pueden ver comentarios de su lección
CREATE POLICY "Users can view lesson comments"
  ON comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM course_users
      WHERE course_users.id = auth.uid()
      AND course_users.payment_verified = true
    )
  );

-- Usuarios pueden crear comentarios
CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM course_users
      WHERE course_users.id = auth.uid()
      AND course_users.payment_verified = true
    )
  );

-- =====================================================
-- FUNCIÓN: Crear usuario del curso automáticamente
-- Se ejecuta cuando un usuario se registra en Supabase Auth
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.course_users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar la función cuando se crea un usuario
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- DATOS INICIALES: Módulos de ejemplo para Curso Wazuh
-- =====================================================
INSERT INTO modules (title, description, order_index, is_published) VALUES
('Introducción a Wazuh', 'Conceptos básicos, arquitectura y casos de uso de Wazuh como SIEM', 1, true),
('Instalación y Despliegue', 'Instalación de Wazuh en diferentes entornos: single-node, cluster y Docker', 2, true),
('Configuración de Agentes', 'Despliegue y configuración de agentes en Windows, Linux y macOS', 3, true),
('Detección de Amenazas', 'Reglas de detección, decoders personalizados y alertas', 4, false),
('Cumplimiento ENS', 'Configuración de Wazuh para cumplir con el Esquema Nacional de Seguridad', 5, false),
('Integraciones y Dashboards', 'Integración con Elastic, Grafana y creación de dashboards personalizados', 6, false);

-- =====================================================
-- DATOS INICIALES: Lecciones de ejemplo
-- =====================================================
INSERT INTO lessons (module_id, title, description, video_url, duration_minutes, order_index, is_published, text_content, resources) VALUES
-- Módulo 1: Introducción
(1, '¿Qué es Wazuh?', 'Introducción al SIEM open-source más popular', 'https://www.youtube.com/watch?v=EXAMPLE1', 15, 1, true,
  'Wazuh es una plataforma de seguridad open-source que proporciona detección de amenazas, monitoreo de integridad, respuesta a incidentes y cumplimiento normativo.',
  '[{"name": "Documentación oficial Wazuh", "url": "https://documentation.wazuh.com", "type": "link"}]'::jsonb),
(1, 'Arquitectura de Wazuh', 'Componentes: Manager, Agents, Indexer y Dashboard', 'https://www.youtube.com/watch?v=EXAMPLE2', 20, 2, true,
  'La arquitectura de Wazuh se compone de varios elementos clave que trabajan juntos para proporcionar una solución de seguridad completa.',
  '[{"name": "Diagrama de arquitectura", "url": "/recursos/arquitectura-wazuh.pdf", "type": "pdf"}]'::jsonb),
(1, 'Casos de uso empresariales', 'Por qué las empresas eligen Wazuh', 'https://www.youtube.com/watch?v=EXAMPLE3', 12, 3, true,
  'Descubre los principales casos de uso de Wazuh en entornos empresariales reales.',
  '[]'::jsonb),

-- Módulo 2: Instalación
(2, 'Requisitos del sistema', 'Hardware, software y red necesarios', 'https://www.youtube.com/watch?v=EXAMPLE4', 10, 1, true,
  'Antes de instalar Wazuh, asegúrate de cumplir con los requisitos mínimos de hardware y software.',
  '[{"name": "Checklist de requisitos", "url": "/recursos/requisitos-wazuh.pdf", "type": "pdf"}]'::jsonb),
(2, 'Instalación single-node', 'Instalación todo-en-uno para entornos pequeños', 'https://www.youtube.com/watch?v=EXAMPLE5', 25, 2, true,
  'Guía paso a paso para instalar Wazuh en un único servidor.',
  '[{"name": "Script de instalación", "url": "/recursos/install-wazuh.sh", "type": "other"}]'::jsonb),
(2, 'Instalación con Docker', 'Despliegue containerizado de Wazuh', 'https://www.youtube.com/watch?v=EXAMPLE6', 20, 3, true,
  'Aprende a desplegar Wazuh usando Docker y Docker Compose.',
  '[{"name": "docker-compose.yml", "url": "/recursos/docker-compose-wazuh.yml", "type": "other"}]'::jsonb);

-- =====================================================
-- FUNCIÓN: Actualizar timestamp de updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_course_users_updated_at
  BEFORE UPDATE ON course_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
