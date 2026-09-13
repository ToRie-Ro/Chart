class CallRecord {
  const CallRecord({
    required this.id,
    required this.callerId,
    required this.recipientId,
    required this.type,
    required this.status,
    this.startedAt,
    this.endedAt,
    this.callerName,
    this.recipientName,
  });

  factory CallRecord.fromJson(Map<String, dynamic> j) => CallRecord(
    id:            j['id']?.toString()            ?? '',
    callerId:      j['caller_id']?.toString()     ?? j['callerId']?.toString() ?? '',
    recipientId:   j['recipient_id']?.toString()  ?? j['recipientId']?.toString() ?? '',
    type:          j['type']?.toString()          ?? 'voice',
    status:        j['status']?.toString()        ?? 'missed',
    startedAt:     j['started_at']?.toString()    ?? j['startedAt']?.toString(),
    endedAt:       j['ended_at']?.toString()      ?? j['endedAt']?.toString(),
    callerName:    j['caller_name']?.toString()   ?? j['callerName']?.toString(),
    recipientName: j['recipient_name']?.toString() ?? j['recipientName']?.toString(),
  );

  final String  id;
  final String  callerId;
  final String  recipientId;
  final String  type;
  final String  status;
  final String? startedAt;
  final String? endedAt;
  final String? callerName;
  final String? recipientName;

  bool get isVideo  => type == 'video';
  bool get isMissed => status == 'missed';
  bool get isAnswered => status == 'answered';
}
