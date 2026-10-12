import os
import sys
from pathlib import Path
from django.core.wsgi import get_wsgi_application

# 1. กำหนดตำแหน่งของโฟลเดอร์ backend
BASE_DIR = Path(__file__).resolve().parent.parent

# 2. นำ path ของ backend ยัดเข้าไปในระบบค้นหาไฟล์ของ Python
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = get_wsgi_application()
app = application  # ตัวแปรนี้จำเป็นเพื่อให้ Vercel มองเห็นจุดรันแอป