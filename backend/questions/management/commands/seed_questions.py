import json
import os
from django.core.management.base import BaseCommand
from questions.models import MathQuestion

def map_topic(raw_topic):
    """แมปหัวข้อย่อยใน JSON ให้เข้ากับ 5 หมวดของ MathQuestion.TOPICS"""
    t = (raw_topic or '').lower()
    if 'limit' in t or 'hôpital' in t or 'hopital' in t:
        return 'Limits'
    if any(k in t for k in ('deriv', 'differential', 'chain', 'quotient', 'logarithmic', 'newton')):
        return 'Derivatives'
    if any(k in t for k in ('integral', 'integration', 'trig', 'partial fractions', 'arc length', 'area', 'volume', 'fundamental')):
        return 'Integrals'
    if 'diff eq' in t or 'differential equation' in t:
        return 'Diff Eq'
    # related rates, optimization, extrema, approximation, series, vectors, lines/planes ฯลฯ
    return 'Applications'


class Command(BaseCommand):
    help = 'Seed database with robust format handling from JSON (Auto-clear old data)'

    def handle(self, *args, **kwargs):
        # 1. ล้างข้อมูลเก่าทั้งหมดทิ้งก่อน (ลบทั้ง 400 ข้อทิ้งรวดเดียว)
        MathQuestion.objects.all().delete()
        self.stdout.write(self.style.WARNING('Cleared old duplicated questions!'))

        # 2. ระบุตำแหน่งไฟล์ JSON (เช็คชื่อไฟล์ให้ตรงด้วยนะครับ)
        file_path = os.path.join(os.path.dirname(__file__), 'exam_data.json')
        
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        count = 0
        
        def process_question(q):
            nonlocal count
            if isinstance(q, dict) and 'question' in q and 'choices' in q:
                choices_data = q.get('choices', [])
                choices_texts = [c['text'] for c in choices_data]
                
                correct_idx = 0
                explanation = "ไม่มีคำอธิบาย"
                for i, c in enumerate(choices_data):
                    if c.get('is_correct'):
                        correct_idx = i
                        explanation = c.get('explanation', '')
                        break
                
                MathQuestion.objects.create(
                    topic=map_topic(q.get('topic')),
                    difficulty=2,
                    reference="AI Generated",
                    story="ภารกิจจำลองเพื่อทดสอบระบบหน้าเว็บ",
                    question_latex=q.get('question', ''),
                    choices=choices_texts,
                    correct_answer_index=correct_idx,
                    hints=["ลองทบทวนหลักการของเรื่องนี้ดูนะ"],
                    steps=[f"วิธีทำ: {explanation}"]
                )
                count += 1

        for item in data:
            if isinstance(item, dict):
                process_question(item)
            elif isinstance(item, list):
                for sub_item in item:
                    process_question(sub_item)
                    
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {count} unique questions!'))