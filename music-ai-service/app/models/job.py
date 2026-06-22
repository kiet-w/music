from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class DownloadJob(Base):
    __tablename__ = "DownloadJob"

    id = Column(String, primary_key=True, index=True)
    url = Column(String, nullable=False)
    status = Column(String, default="PENDING", index=True)
    progress = Column(Integer, default=0)
    errorMessage = Column(String, nullable=True)
    downloadUrl = Column(String, nullable=True)
    userId = Column(String, nullable=False, index=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())
