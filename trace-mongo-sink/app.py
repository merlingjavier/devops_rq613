import asyncio
import json
import os
from datetime import datetime
from typing import Any

from aiokafka import AIOKafkaConsumer
from bson.binary import Binary
from pymongo import ASCENDING, MongoClient


def to_binary(payload: Any) -> Binary | None:
    if payload is None:
        return None
    if isinstance(payload, bytes):
        return Binary(payload)
    if isinstance(payload, str):
        return Binary(payload.encode("utf-8"))
    return Binary(json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8"))


def to_datetime(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def to_document(event: dict[str, Any]) -> dict[str, Any]:
    return {
        "identity": event["Identity"],
        "traceId": event.get("TraceId", ""),
        "channelId": event.get("ChannelId", ""),
        "deviceId": event.get("DeviceId", ""),
        "keyword": event.get("Keyword", ""),
        "microserviceName": event.get("MicroserviceName", ""),
        "operationName": event.get("OperationName", ""),
        "requestUrl": event.get("RequestUrl", ""),
        "method": event.get("Method", ""),
        "requestPayload": None,
        "requestDatetime": to_datetime(event.get("RequestDatetime")),
        "responseStatusCode": event.get("ResponseStatusCode"),
        "responsePayload": to_binary(event.get("ResponsePayload")),
        "responseDatetime": to_datetime(event.get("ResponseDatetime")),
    }


async def consume() -> None:
    kafka_topic = os.environ["KAFKA_TOPIC"]
    mongo_client = MongoClient(os.environ["MONGO_CONNECTION_STRING"])
    collection = mongo_client[os.environ["MONGO_DATABASE"]][os.environ["MONGO_COLLECTION"]]
    if os.getenv("MONGO_CREATE_INDEX", "true").lower() == "true":
        collection.create_index([("identity", ASCENDING)], unique=True)

    consumer = AIOKafkaConsumer(
        kafka_topic,
        bootstrap_servers=os.environ["KAFKA_BOOTSTRAP_SERVERS"],
        group_id=os.environ["KAFKA_GROUP_ID"],
        enable_auto_commit=False,
        auto_offset_reset="earliest",
        value_deserializer=lambda value: json.loads(value.decode("utf-8")),
    )

    await consumer.start()
    try:
        async for message in consumer:
            document = to_document(message.value)
            collection.replace_one({"identity": document["identity"]}, document, upsert=True)
            await consumer.commit()
    finally:
        await consumer.stop()
        mongo_client.close()


if __name__ == "__main__":
    asyncio.run(consume())
