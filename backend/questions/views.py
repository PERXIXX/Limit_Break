import random
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import MathQuestion
from .serializers import MathQuestionSerializer


class RandomQuestionView(APIView):
    def get(self, request):
        topic = request.query_params.get("topic")
        questions = MathQuestion.objects.all()
        if topic and topic != "All":
            questions = questions.filter(topic=topic)
        question = questions.order_by('?').first()
        if question is None:
            return Response({"detail": "No questions found for this topic."}, status=404)
        payload = MathQuestionSerializer(question).data
        choices = list(payload["choices"])
        correct_choice = choices.pop(payload["correct_answer_index"])
        random.shuffle(choices)
        insert_at = random.randrange(len(choices) + 1)
        choices.insert(insert_at, correct_choice)
        payload["choices"] = choices
        payload["correct_answer_index"] = insert_at
        return Response(payload)
