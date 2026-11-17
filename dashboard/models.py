from django.db import models

# Create your models here.
from django.db import models 


class APIRequest(models.Model):
    model_name = models.CharField(max_length=100)

    input_tokens = models.PositiveIntegerField(default=0)
    output_tokens = models.PositiveIntegerField(default=0)

    latency_ms = models.PositiveIntegerField(default=0)
    cost_usd = models.DecimalField(
        max_digits=12,
        decimal_places=6,
        default=0,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def total_tokens(self):
        return self.input_tokens + self.output_tokens

    def __str__(self):
        return f"{self.model_name} — {self.total_tokens} tokens"
