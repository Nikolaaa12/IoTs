import asyncio
import json
from datetime import datetime
from nats.aio.client import Client as NATS
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS

influx_host = "localhost"
influx_port = 8087
influx_token = "YS2Vqi_zofhTvYF5fmec6b9GkIPuEecVa4THGCpDN0U0V-f6s0GT0L0Nfu3uCMUwf_q-R4-qRkV0SRtnUznLWA=="
influx_bucket = "Electricity"
influx_org = "IoT_project"

async def subscribe_to_nats_and_send_to_influxdb():

    nc = NATS()

    await nc.connect(servers=["nats://localhost:4222"])

    client = InfluxDBClient(url=f"http://{influx_host}:{influx_port}", token=influx_token)

    write_api = client.write_api(write_options=SYNCHRONOUS)

    async def message_handler(msg):

        data = json.loads(msg.data.decode())
        print(f"Primljena poruka na temi {msg.subject}: {data}")

        point = Point("electricity").tag("location", "home").time(datetime.utcnow())

        for field_name, field_value in data.items():
            point.field(field_name, field_value)

        write_api.write(bucket=influx_bucket, org=influx_org, record=point)

    try:

        await nc.subscribe("average_data", cb=message_handler)
        print(f"Pretplaćeni ste na temu 'average_data' i čekate poruke...")

        while True:
            await asyncio.sleep(1)

    except Exception as e:
        print(f"Greška prilikom pretplate na temu: {e}")

    finally:

        await nc.close()
        client.close()

if __name__ == '__main__':
    asyncio.run(subscribe_to_nats_and_send_to_influxdb())
