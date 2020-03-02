using backend.core.Commands;

namespace backend.Requests
{
    public class CreatePlayerRequest
    {
        public string name { get; set; }

        public PlayerCmd toCmd()
        {
            return new PlayerCmd
            {
                name = this.name
            };
        }
    }
}