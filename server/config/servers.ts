import { inip, ip } from './config';
module.exports = {
    'development': {
        'gate': [{
            'id': 'gate-server-1',
            'host': ip,
            'clientPort': 3014,
            'frontend': true,
            'args': '--inspect=10003'
        }],
        'connector': [{
            'id': 'connector-server-1',
            'host': ip,
            'port': 4050,
            'clientPort': 3050,
            'frontend': true,
            'args': '--inspect=10001'
        },
        {
            'id': 'connector-server-2',
            'host': ip,
            'port': 4051,
            'clientPort': 3051,
            'frontend': true,
            'args': '--inspect=10002'
        }],
        'hall': [{
            'id': 'hall-server-1',
            'host': inip,
            'port': 8050,
            'args': '--inspect=20001'
        }],
        'game': [{
            'id': 'game-server-1',
            'host': inip,
            'port': 8051,
            'args': '--inspect=20002'
        }],
        'club': [{
            'id': 'club-server-1',
            'host': inip,
            'port': 8060,
            'args': '--inspect=20003'
        }]
    },
    'production': {
        'gate': [{
            'id': 'gate-server-1',
            'host': ip,
            'clientPort': 3014,
            'frontend': true
        }],
        'connector': [{
            'id': 'connector-server-1',
            'host': ip,
            'port': 4050,
            'clientPort': 3050,
            'frontend': true
        },
        {
            'id': 'connector-server-2',
            'host': ip,
            'port': 4051,
            'clientPort': 3051,
            'frontend': true
        }
        ],
        'hall': [{
            'id': 'hall-server-1',
            'host': inip,
            'port': 8050
        }],
        'game': [{
            'id': 'game-server-1',
            'host': inip,
            'port': 8051
        }],
        'club': [{
            'id': 'club-server-1',
            'host': inip,
            'port': 8052
        }],
    }
};