using System;
using System.Threading.Tasks;
using Grpc.Net.Client;
using GrpcClient;

class Program
{
    static async Task Main(string[] args)
    {
        using var channel = GrpcChannel.ForAddress("http://localhost:5240");

        var client = new ElectricityConsumption.ElectricityConsumptionClient(channel);

        try
        {
            var request = new ElectricityConsumptionAggregationRequest
            {
                StartTimestamp = "2024-04-18T15:24:16Z", 
                EndTimestamp = "2024-04-19T15:24:16Z",   
                Operation = "sum",                       
                FieldName = "Consumption"              
            };

            var response = await client.ElectricityConsumptionAggregationAsync(request);

            Console.WriteLine($"Aggregation Result: {response.Result}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
        
        Console.ReadLine();
    }
}
