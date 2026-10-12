from pathlib import Path
import os
import dj_database_url

# 1. ย้าย BASE_DIR ขึ้นมาก่อน
BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = "development-only-change-me"
DEBUG = True
ALLOWED_HOSTS = ['*']  

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "questions",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {"context_processors": [
            "django.template.context_processors.request",
            "django.contrib.auth.context_processors.auth",
            "django.contrib.messages.context_processors.messages",
        ]},
    }
]
WSGI_APPLICATION = "config.wsgi.application"

# ดึงค่า URL และตัดช่องว่างส่วนเกินทิ้ง
DB_URL = os.environ.get('DATABASE_URL', '').strip()

# ถ้ามี URL ของ Supabase ส่งมาจริงๆ ค่อยเชื่อมต่อ
if DB_URL != '':
    DATABASES = {
        'default': dj_database_url.parse(DB_URL, conn_max_age=600, conn_health_checks=True)
    }
# ถ้าไม่มี (เช่น รันในเครื่องที่ไม่ได้ตั้งตัวแปรไว้) ให้ใช้ SQLite สำรองไปก่อน ระบบจะได้ไม่พัง
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_PASSWORD_VALIDATORS = []
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# อย่าลืมเปลี่ยนลิงก์ข้างล่างให้ตรงกับโดเมน Vercel ปัจจุบันของคุณ (ถ้าเปลี่ยนชื่อโปรเจกต์)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173", 
    "http://127.0.0.1:5173",
    "https://precise-capture-wizard.vercel.app", 
    "https://breaklimit-ochre.vercel.app",
]
CORS_ALLOW_ALL_ORIGINS = DEBUG