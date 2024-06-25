import asyncio
import json
from datetime import datetime
from nats.aio.client import Client as NATS
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS

influx_host = "172.29.0.6"  
influx_port = 8086
influx_token = "9yldtW_yJrRsTBCKBax1xQLHJk5E-4vDcZh-yjoRNG4o0EtEt_AeIl5wf2mONzjWBk448fuYkHC7Qnp71Kdjig=="
influx_bucket = "Electricity"
influx_org = "IoT_project"

async def subscribe_to_nats_and_send_to_influxdb():

    nc = NATS()

    try:
        await nc.connect(servers=["nats://nats:4222"])

        client = InfluxDBClient(url=f"http://{influx_host}:{influx_port}", token=influx_token)
        write_api = client.write_api(write_options=SYNCHRONOUS)

        async def message_handler(msg):
            data = json.loads(msg.data.decode())
            print(f"Received message on subject {msg.subject}: {data}")

            point = Point("electricity").tag("location", "home").time(datetime.utcnow())

            for field_name, field_value in data.items():
                point.field(field_name, field_value)

            write_api.write(bucket=influx_bucket, org=influx_org, record=point)

        await nc.subscribe("average_data", cb=message_handler)
        print("Subscribed to 'average_data' topic and waiting for messages...")

        while True:
            await asyncio.sleep(1)

    except Exception as e:
        print(f"Error: {e}")

    finally:
        await nc.close()
        client.close()

if __name__ == '__main__':
    asyncio.run(subscribe_to_nats_and_send_to_influxdb())
