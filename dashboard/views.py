
from django.shortcuts import render


def home(request):
    metrics = {
        "total_tokens": 128450,
        "estimated_savings": "12.84",
        "cache_hit_rate": 34.8,
        "total_requests": 2406,
    }

    context = {
        "metrics": metrics,
    }

    return render(request, "dashboard/home.html", context)
