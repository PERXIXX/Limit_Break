from pathlib import Path
import os
import dj_database_url
from dotenv import load_dotenv

# 1. ย้าย BASE_DIR ขึ้นมาก่อน
BASE_DIR = Path(__file__).resolve().parent.parent

# 2. บังคับให้โหลดไฟล์ .env จากโฟลเดอร์โปรเจกต์โดยตรง
load_dotenv(str(BASE_DIR / '.env'))
SECRET_KEY = "development-only-change-me"
DEBUG = True
SECRET_KEY = "development-only-change-me"
DEBUG = True
ALLOWED_HOSTS = ['*']  # <--- เพิ่มบรรทัดนี้เข้าไปครับ อนุญาตให้เข้าถึงได้จากทุกที่
# ... (โค้ดส่วนที่เหลือคงไว้เหมือนเดิมครับ)
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

# เปลี่ยนจาก SQLite เป็นการดึง URL ของ Supabase มาใช้
DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL'),
        conn_max_age=600,
        conn_health_checks=True,
    )
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
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173", 
    "http://127.0.0.1:5173",
    "https://precise-capture-wizard.vercel.app",  # <--- เพิ่มบรรทัดนี้เข้าไป (ห้ามมีเครื่องหมาย / ต่อท้าย)
]
CORS_ALLOW_ALL_ORIGINS = DEBUG
