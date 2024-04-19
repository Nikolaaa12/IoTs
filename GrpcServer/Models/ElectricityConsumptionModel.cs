using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace GrpcServer.Models
{
    public class ElectricityConsumptionModel
    {
        public ObjectId _id { get; set; }
        public DateTime DateTime { get; set; }
        public int Consumption { get; set; }
        public int Production { get; set; }
        public int Nuclear { get; set; }
        public int Wind { get; set; }
        public int Hydroelectric { get; set; }
            
        [BsonElement("Oil and Gas")]
        public int OilAndGas { get; set; }
        public int Coal { get; set; }
        public int Solar { get; set; }
        public int Biomass { get; set; }
    }
}