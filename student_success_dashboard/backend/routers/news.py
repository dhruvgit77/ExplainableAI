from fastapi import APIRouter

from ..services import news_service

router = APIRouter(prefix="/api/news", tags=["News"])


@router.get("/feed")
def feed():
    return news_service.get_news()
