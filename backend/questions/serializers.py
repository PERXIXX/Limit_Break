from rest_framework import serializers
from .models import MathQuestion


class MathQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MathQuestion
        fields = "__all__"
