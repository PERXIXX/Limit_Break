from django.urls import path
from .views import RandomQuestionView

urlpatterns = [
    path("questions/", RandomQuestionView.as_view(), name="random-question"),
]
