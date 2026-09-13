import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../models/message.dart';

const _wsBase = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://chart-ztyk.onrender.com',
);

String _wsUrl(String token) {
  final wsScheme = _wsBase.replaceFirst('https://', 'wss://').replaceFirst('http://', 'ws://');
  return '$wsScheme/ws?token=$token';
}

enum WsStatus { disconnected, connecting, connected }

class WsClient {
  WsClient._();
  static final WsClient instance = WsClient._();

  WebSocketChannel? _channel;
  WsStatus _status = WsStatus.disconnected;
  WsStatus get status => _status;

  final _messageController = StreamController<AppMessage>.broadcast();
  final _typingController   = StreamController<Map<String, dynamic>>.broadcast();
  final _presenceController = StreamController<Map<String, dynamic>>.broadcast();
  final _statusController   = StreamController<WsStatus>.broadcast();

  Stream<AppMessage> get messages => _messageController.stream;
  Stream<Map<String, dynamic>> get typingEvents => _typingController.stream;
  Stream<Map<String, dynamic>> get presenceEvents => _presenceController.stream;
  Stream<WsStatus> get statusStream => _statusController.stream;

  Timer? _reconnectTimer;
  String? _token;

  void connect(String token) {
    _token = token;
    _connect();
  }

  void _connect() {
    if (_status == WsStatus.connecting || _status == WsStatus.connected) return;
    _setStatus(WsStatus.connecting);
    try {
      _channel = WebSocketChannel.connect(Uri.parse(_wsUrl(_token ?? '')));
      _setStatus(WsStatus.connected);
      _channel!.stream.listen(
        _onData,
        onDone: _onDone,
        onError: (_) => _onDone(),
        cancelOnError: true,
      );
    } catch (_) {
      _onDone();
    }
  }

  void _onData(dynamic raw) {
    try {
      final data = jsonDecode(raw.toString()) as Map<String, dynamic>;
      final type = data['type']?.toString();
      final payload = data['payload'];
      switch (type) {
        case 'message':
          if (payload is Map<String, dynamic>) {
            _messageController.add(AppMessage.fromJson(payload));
          }
        case 'typing':
          if (payload is Map<String, dynamic>) _typingController.add(payload);
        case 'presence':
          if (payload is Map<String, dynamic>) _presenceController.add(payload);
      }
    } catch (_) {}
  }

  void _onDone() {
    _setStatus(WsStatus.disconnected);
    _scheduleReconnect();
  }

  void _scheduleReconnect() {
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 5), () {
      if (_token != null) _connect();
    });
  }

  void sendMessage(String conversationId, String text) {
    if (_status != WsStatus.connected) return;
    _channel?.sink.add(jsonEncode({'conversationId': conversationId, 'text': text}));
  }

  void sendTyping(String conversationId) {
    if (_status != WsStatus.connected) return;
    _channel?.sink.add(jsonEncode({'type': 'typing', 'conversationId': conversationId}));
  }

  void disconnect() {
    _reconnectTimer?.cancel();
    _token = null;
    _channel?.sink.close();
    _channel = null;
    _setStatus(WsStatus.disconnected);
  }

  void _setStatus(WsStatus s) {
    _status = s;
    _statusController.add(s);
  }

  void dispose() {
    disconnect();
    _messageController.close();
    _typingController.close();
    _presenceController.close();
    _statusController.close();
  }
}
