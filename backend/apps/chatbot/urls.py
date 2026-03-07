from django.urls import path

from . import views

urlpatterns = [
    path("chatbot/message/", views.chatbot_message, name="chatbot-message"),
    path("kisan-mitra/token/", views.kisan_mitra_token, name="kisan-mitra-token"),
    path("kisan-mitra/voice/", views.kisan_mitra_voice, name="kisan-mitra-voice"),
    path("kisan-mitra/text/", views.kisan_mitra_text, name="kisan-mitra-text"),
    path("kisan-mitra/tts/", views.kisan_mitra_tts, name="kisan-mitra-tts"),
]
