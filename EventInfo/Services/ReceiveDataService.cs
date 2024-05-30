using MQTTnet.Client;
using MQTTnet;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace EventInfo.Services
{
    public class MqttService
    {
        private readonly IMqttClient _mqttClient;
        private readonly List<dynamic> _filteredData = new List<dynamic>();

        public MqttService()
        {
            var mqttFactory = new MqttFactory();
            _mqttClient = mqttFactory.CreateMqttClient();

            var mqttOptions = new MqttClientOptionsBuilder()
                .WithClientId("EventInfoMicroservice")
                .WithTcpServer("localhost", 1883)
                .Build();

            _mqttClient.ConnectedAsync += async e =>
            {
                await _mqttClient.SubscribeAsync(new MqttTopicFilterBuilder().WithTopic("filteredDataTopic").Build());
                Console.WriteLine("Connected to MQTT broker and subscribed to topic.");
            };

            _mqttClient.ApplicationMessageReceivedAsync += HandleReceivedMessage;

            _mqttClient.ConnectAsync(mqttOptions).Wait();
        }

        private Task HandleReceivedMessage(MqttApplicationMessageReceivedEventArgs e)
        {
            var message = Encoding.UTF8.GetString(e.ApplicationMessage.Payload);
            var jsonData = JsonSerializer.Deserialize<Dictionary<string, object>>(message);

            if (jsonData != null)
            {
                _filteredData.Add(jsonData);
                Console.WriteLine($"Received data: {message}");
            }
            else
            {
                Console.WriteLine($"Received message: {message}");
            }

            return Task.CompletedTask;
        }

        public Task<List<dynamic>> GetFilteredData(string filterType)
        {
            var filteredData = _filteredData
                .Where(d => d.ContainsKey("type") && d["type"].ToString() == filterType)
                .Select(d => d["data"])
                .ToList();

            return Task.FromResult(filteredData);
        }


        public async Task DisconnectFromMqttBrokerAsync()
        {
            await _mqttClient.DisconnectAsync();
        }
    }
}
