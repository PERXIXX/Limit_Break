from django.db import models


class MathQuestion(models.Model):
    TOPICS = [
        ("Limits", "Limits"),
        ("Derivatives", "Derivatives"),
        ("Integrals", "Integrals"),
        ("Applications", "Applications"),
        ("Diff Eq", "Diff Eq"),
    ]

    topic = models.CharField(max_length=32, choices=TOPICS)
    difficulty = models.PositiveSmallIntegerField()
    reference = models.CharField(max_length=200)
    story = models.TextField()
    question_latex = models.TextField()
    image_url = models.URLField(blank=True)
    choices = models.JSONField()
    correct_answer_index = models.PositiveSmallIntegerField()
    hints = models.JSONField()
    steps = models.JSONField()

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.topic}: {self.question_latex[:50]}"
