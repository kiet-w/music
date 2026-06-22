from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.job import DownloadJob

class JobRepository:
    def __init__(self, db: Session):
        self.db = db

    def update_job(self, job_id: str, **kwargs):
        job = self.db.query(DownloadJob).filter(DownloadJob.id == job_id).first()
        if job:
            for key, value in kwargs.items():
                setattr(job, key, value)
            self.db.commit()
            self.db.refresh(job)
        return job

class AsyncJobRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
        
    async def create_job(self, job_id: str, url: str, user_id: str):
        job = DownloadJob(id=job_id, url=url, userId=user_id, status="PENDING", progress=0)
        self.db.add(job)
        await self.db.commit()
        return job

    async def get_job(self, job_id: str):
        result = await self.db.execute(select(DownloadJob).where(DownloadJob.id == job_id))
        return result.scalars().first()
