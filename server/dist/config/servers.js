"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
module.exports = {
    'development': {
        'gate': [{
                'id': 'gate-server-1',
                'host': config_1.ip,
                'clientPort': 3014,
                'frontend': true,
                'args': '--inspect=10003'
            }],
        'connector': [{
                'id': 'connector-server-1',
                'host': config_1.ip,
                'port': 4050,
                'clientPort': 3050,
                'frontend': true,
                'args': '--inspect=10001'
            },
            {
                'id': 'connector-server-2',
                'host': config_1.ip,
                'port': 4051,
                'clientPort': 3051,
                'frontend': true,
                'args': '--inspect=10002'
            }],
        'hall': [{
                'id': 'hall-server-1',
                'host': config_1.inip,
                'port': 8050,
                'args': '--inspect=20001'
            }],
        'game': [{
                'id': 'game-server-1',
                'host': config_1.inip,
                'port': 8051,
                'args': '--inspect=20002'
            }],
        'club': [{
                'id': 'club-server-1',
                'host': config_1.inip,
                'port': 8060,
                'args': '--inspect=20003'
            }]
    },
    'production': {
        'gate': [{
                'id': 'gate-server-1',
                'host': config_1.ip,
                'clientPort': 3014,
                'frontend': true
            }],
        'connector': [{
                'id': 'connector-server-1',
                'host': config_1.ip,
                'port': 4050,
                'clientPort': 3050,
                'frontend': true
            },
            {
                'id': 'connector-server-2',
                'host': config_1.ip,
                'port': 4051,
                'clientPort': 3051,
                'frontend': true
            }
        ],
        'hall': [{
                'id': 'hall-server-1',
                'host': config_1.inip,
                'port': 8050
            }],
        'game': [{
                'id': 'game-server-1',
                'host': config_1.inip,
                'port': 8051
            }],
        'club': [{
                'id': 'club-server-1',
                'host': config_1.inip,
                'port': 8052
            }],
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2NvbmZpZy9zZXJ2ZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEscUNBQW9DO0FBQ3BDLE1BQU0sQ0FBQyxPQUFPLEdBQUc7SUFDYixhQUFhLEVBQUU7UUFDWCxNQUFNLEVBQUUsQ0FBQztnQkFDTCxJQUFJLEVBQUUsZUFBZTtnQkFDckIsTUFBTSxFQUFFLFdBQUU7Z0JBQ1YsWUFBWSxFQUFFLElBQUk7Z0JBQ2xCLFVBQVUsRUFBRSxJQUFJO2dCQUNoQixNQUFNLEVBQUUsaUJBQWlCO2FBQzVCLENBQUM7UUFDRixXQUFXLEVBQUUsQ0FBQztnQkFDVixJQUFJLEVBQUUsb0JBQW9CO2dCQUMxQixNQUFNLEVBQUUsV0FBRTtnQkFDVixNQUFNLEVBQUUsSUFBSTtnQkFDWixZQUFZLEVBQUUsSUFBSTtnQkFDbEIsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLE1BQU0sRUFBRSxpQkFBaUI7YUFDNUI7WUFDRDtnQkFDSSxJQUFJLEVBQUUsb0JBQW9CO2dCQUMxQixNQUFNLEVBQUUsV0FBRTtnQkFDVixNQUFNLEVBQUUsSUFBSTtnQkFDWixZQUFZLEVBQUUsSUFBSTtnQkFDbEIsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLE1BQU0sRUFBRSxpQkFBaUI7YUFDNUIsQ0FBQztRQUNGLE1BQU0sRUFBRSxDQUFDO2dCQUNMLElBQUksRUFBRSxlQUFlO2dCQUNyQixNQUFNLEVBQUUsYUFBSTtnQkFDWixNQUFNLEVBQUUsSUFBSTtnQkFDWixNQUFNLEVBQUUsaUJBQWlCO2FBQzVCLENBQUM7UUFDRixNQUFNLEVBQUUsQ0FBQztnQkFDTCxJQUFJLEVBQUUsZUFBZTtnQkFDckIsTUFBTSxFQUFFLGFBQUk7Z0JBQ1osTUFBTSxFQUFFLElBQUk7Z0JBQ1osTUFBTSxFQUFFLGlCQUFpQjthQUM1QixDQUFDO1FBQ0YsTUFBTSxFQUFFLENBQUM7Z0JBQ0wsSUFBSSxFQUFFLGVBQWU7Z0JBQ3JCLE1BQU0sRUFBRSxhQUFJO2dCQUNaLE1BQU0sRUFBRSxJQUFJO2dCQUNaLE1BQU0sRUFBRSxpQkFBaUI7YUFDNUIsQ0FBQztLQUNMO0lBQ0QsWUFBWSxFQUFFO1FBQ1YsTUFBTSxFQUFFLENBQUM7Z0JBQ0wsSUFBSSxFQUFFLGVBQWU7Z0JBQ3JCLE1BQU0sRUFBRSxXQUFFO2dCQUNWLFlBQVksRUFBRSxJQUFJO2dCQUNsQixVQUFVLEVBQUUsSUFBSTthQUNuQixDQUFDO1FBQ0YsV0FBVyxFQUFFLENBQUM7Z0JBQ1YsSUFBSSxFQUFFLG9CQUFvQjtnQkFDMUIsTUFBTSxFQUFFLFdBQUU7Z0JBQ1YsTUFBTSxFQUFFLElBQUk7Z0JBQ1osWUFBWSxFQUFFLElBQUk7Z0JBQ2xCLFVBQVUsRUFBRSxJQUFJO2FBQ25CO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLG9CQUFvQjtnQkFDMUIsTUFBTSxFQUFFLFdBQUU7Z0JBQ1YsTUFBTSxFQUFFLElBQUk7Z0JBQ1osWUFBWSxFQUFFLElBQUk7Z0JBQ2xCLFVBQVUsRUFBRSxJQUFJO2FBQ25CO1NBQ0E7UUFDRCxNQUFNLEVBQUUsQ0FBQztnQkFDTCxJQUFJLEVBQUUsZUFBZTtnQkFDckIsTUFBTSxFQUFFLGFBQUk7Z0JBQ1osTUFBTSxFQUFFLElBQUk7YUFDZixDQUFDO1FBQ0YsTUFBTSxFQUFFLENBQUM7Z0JBQ0wsSUFBSSxFQUFFLGVBQWU7Z0JBQ3JCLE1BQU0sRUFBRSxhQUFJO2dCQUNaLE1BQU0sRUFBRSxJQUFJO2FBQ2YsQ0FBQztRQUNGLE1BQU0sRUFBRSxDQUFDO2dCQUNMLElBQUksRUFBRSxlQUFlO2dCQUNyQixNQUFNLEVBQUUsYUFBSTtnQkFDWixNQUFNLEVBQUUsSUFBSTthQUNmLENBQUM7S0FDTDtDQUNKLENBQUMifQ==