from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []

    operations = [
        migrations.CreateModel(
            name="MathQuestion",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("topic", models.CharField(choices=[("Limits", "Limits"), ("Derivatives", "Derivatives"), ("Integrals", "Integrals"), ("Applications", "Applications"), ("Diff Eq", "Diff Eq")], max_length=32)),
                ("difficulty", models.PositiveSmallIntegerField()),
                ("reference", models.CharField(max_length=200)),
                ("story", models.TextField()),
                ("question_latex", models.TextField()),
                ("choices", models.JSONField()),
                ("correct_answer_index", models.PositiveSmallIntegerField()),
                ("hints", models.JSONField()),
                ("steps", models.JSONField()),
            ],
            options={"ordering": ["id"]},
        ),
    ]
