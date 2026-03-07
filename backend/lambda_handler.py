import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from mangum import Mangum
from django.core.asgi import get_asgi_application

application = get_asgi_application()
handler = Mangum(application, lifespan="off")
