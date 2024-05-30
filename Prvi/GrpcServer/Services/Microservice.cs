using System;
using System.Threading.Tasks;
using Grpc.Core;
using MongoDB.Bson;
using MongoDB.Driver;
using Google.Protobuf.WellKnownTypes;
using GrpcServer.Models;
using GrpcServer;

namespace GrpcServer.Services;
public class Microservices : ElectricityConsumption.ElectricityConsumptionBase
{
    private readonly IMongoCollection<ElectricityConsumptionModel> _collection;

    public Microservices(IMongoDatabase database)
    {
        _collection = database.GetCollection<ElectricityConsumptionModel>("electricity_consumption");
    }

    public override async Task<ValueMessage> GetElectricityConsumptionValueById(ElectricityConsumptionId request, ServerCallContext context)
    {
        var Id = request.Id;

        Console.WriteLine(Id);

        ObjectId objectId;
        try
        {
            objectId = ObjectId.Parse(Id);
        }
        catch (FormatException)
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid ObjectId format"));
        }

        var filter = Builders<ElectricityConsumptionModel>.Filter.Eq(x => x._id, objectId);

        var electricityConsumption = await _collection.Find(filter).FirstOrDefaultAsync();

        if (electricityConsumption == null)
        {
            throw new RpcException(new Status(StatusCode.NotFound, "Electricity consumption value not found"));
        }

        Console.WriteLine(electricityConsumption.Nuclear);

        return await Task.FromResult(new ValueMessage
        {
            Id = electricityConsumption._id.ToString(),
            Electricityconsumptionvalue = new ElectricityConsumptionValue
            {
                Date = electricityConsumption.DateTime.ToString(),
                Consumption = electricityConsumption.Consumption,
                Production = electricityConsumption.Production,
                Nuclear = electricityConsumption.Nuclear,
                Wind = electricityConsumption.Wind,
                Hydroelectric = electricityConsumption.Hydroelectric,
                OilAndGas = electricityConsumption.OilAndGas,
                Coal = electricityConsumption.Coal,
                Solar = electricityConsumption.Solar,
                Biomass = electricityConsumption.Biomass
            },
            Message = "Electricity consumption value found"
        });
    }

    public override async Task<ValueMessage> AddElectricityConsumptionValue(ElectricityConsumptionValue request, ServerCallContext context)
    {
        var objectId = ObjectId.GenerateNewId();

        var filter = Builders<ElectricityConsumptionModel>.Filter.Eq(x => x._id, objectId);

        var electricityConsumptionValue = await _collection.Find(filter).FirstOrDefaultAsync();

        if (electricityConsumptionValue != null)
        {
            return await Task.FromResult(new ValueMessage
            {
                Id = electricityConsumptionValue._id.ToString(),
                Message = "There is a electricity consumption with the same id in database"
            });
        }
        var newValue = new ElectricityConsumptionModel
        {
            _id = objectId,
            DateTime = DateTime.Now,
            Consumption = request.Consumption,
            Production = request.Production,
            Nuclear = request.Nuclear,
            Wind = request.Wind,
            Hydroelectric = request.Hydroelectric,
            OilAndGas = request.OilAndGas,
            Coal = request.Coal,
            Solar = request.Solar,
            Biomass = request.Biomass
        };
        await _collection.InsertOneAsync(newValue);

        return await Task.FromResult(new ValueMessage
        {
            Id = newValue._id.ToString(),
            Message = "Electricity consumption value added successfully"
        });

    }


    public override async Task<ValueMessage> DeleteElectricityConsumptionById(ElectricityConsumptionId request, ServerCallContext context)
    {
        var Id = request.Id;
        ObjectId objectId;
        try
        {
            objectId = ObjectId.Parse(Id);
        }
        catch (FormatException)
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid ObjectId format"));
        }
        var filter = Builders<ElectricityConsumptionModel>.Filter.Eq(x => x._id, objectId);

        var electricityConsumptionValue = await _collection.FindOneAndDeleteAsync(filter);

        if (electricityConsumptionValue == null)
        {
            throw new RpcException(new Status(StatusCode.NotFound, "Electricity consumption with the requested Id not found"));
        }

        return await Task.FromResult(new ValueMessage
        {
            Id = objectId.ToString(),
            Message = "Electricity consumption with the requested Id has been successfully deleted"
        });
    }

    public override async Task<ValueMessage> UpdateElectricityConsumptionById(ElectricityConsumptionValue request, ServerCallContext context)
    {
        var Id = request.Id;
        ObjectId objectId;
        try
        {
            objectId = ObjectId.Parse(Id);
        }
        catch (FormatException)
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid ObjectId format"));
        }

        var filter = Builders<ElectricityConsumptionModel>.Filter.Eq(x => x._id, objectId);

        var electricityConsumptionValue = await _collection.Find(filter).FirstOrDefaultAsync();

        if (electricityConsumptionValue == null)
        {
            throw new RpcException(new Status(StatusCode.NotFound, "There is no electricity consumption with the same Id in database"));
        }

        electricityConsumptionValue.Consumption = request.Consumption;
        electricityConsumptionValue.Production = request.Production;
        electricityConsumptionValue.Nuclear = request.Nuclear;
        electricityConsumptionValue.Wind = request.Wind;
        electricityConsumptionValue.Hydroelectric = request.Hydroelectric;
        electricityConsumptionValue.OilAndGas = request.OilAndGas;
        electricityConsumptionValue.Coal = request.Coal;
        electricityConsumptionValue.Solar = request.Solar;
        electricityConsumptionValue.Biomass = request.Biomass;

        await _collection.ReplaceOneAsync(filter, electricityConsumptionValue);

        return new ValueMessage
        {
            Id = objectId.ToString(),
            Message = "Electricity consumption with the requested ID has been successfully updated"
        };
    }
    public override async Task<AggregationValue> ElectricityConsumptionAggregation(ElectricityConsumptionAggregationRequest request, ServerCallContext context)
    {
        try
        {
            var startTimestamp = DateTime.Parse(request.StartTimestamp);
            var endTimestamp = DateTime.Parse(request.EndTimestamp);

            var projection = Builders<ElectricityConsumptionModel>.Projection.Include(request.FieldName);
            var filter = Builders<ElectricityConsumptionModel>.Filter.And(
                Builders<ElectricityConsumptionModel>.Filter.Gte("DateTime", startTimestamp),
                Builders<ElectricityConsumptionModel>.Filter.Lte("DateTime", endTimestamp)
            );

            var values = await _collection.Find(filter)
                                          .Project(projection)
                                          .ToListAsync();

            var fieldValues = new List<double>();

            foreach (var document in values)
            {
                if (document.TryGetValue(request.FieldName, out BsonValue fieldValue))
                {
                    if (fieldValue.IsNumeric)
                    {
                        if (fieldValue.IsInt32)
                        {
                            fieldValues.Add(fieldValue.AsInt32);
                        }
                        else if (fieldValue.IsDouble)
                        {
                            fieldValues.Add(fieldValue.AsDouble);
                        }
                    }
                }
            }

            double result;

            switch (request.Operation.ToLower())
            {
                case "min":
                    if (fieldValues.Any())
                    {
                        result = fieldValues.Min();
                    }
                    else
                    {
                        throw new RpcException(new Status(StatusCode.InvalidArgument, "No values found for minimum operation"));
                    }
                    break;
                case "max":
                    if (fieldValues.Any())
                    {
                        result = fieldValues.Max();
                    }
                    else
                    {
                        throw new RpcException(new Status(StatusCode.InvalidArgument, "No values found for maximum operation"));
                    }
                    break;
                case "avg":
                    if (fieldValues.Any())
                    {
                        result = fieldValues.Average();
                    }
                    else
                    {
                        throw new RpcException(new Status(StatusCode.InvalidArgument, "No values found for average operation"));
                    }
                    break;
                case "sum":
                    result = fieldValues.Sum();
                    break;
                default:
                    throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid aggregation operation type"));
            }

            return new AggregationValue
            {
                Result = result
            };
        }
        catch (Exception ex)
        {
            throw new RpcException(new Status(StatusCode.Internal, $"Error performing aggregation: {ex.Message}"));
        }
    }
}
