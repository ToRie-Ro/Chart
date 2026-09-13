class AppUser {
  const AppUser({
    required this.id,
    required this.name,
    required this.email,
    required this.username,
    this.bio = '',
    this.avatarUrl,
    this.plan = 'free',
    this.isOnline = false,
    this.lastSeen,
    this.locale = 'en',
    this.role = 'user',
  });

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
    id:        j['id']?.toString()        ?? '',
    name:      j['name']?.toString()      ?? 'Unknown',
    email:     j['email']?.toString()     ?? '',
    username:  j['username']?.toString()  ?? '',
    bio:       j['bio']?.toString()       ?? '',
    avatarUrl: j['avatarUrl']?.toString() ?? j['avatar_url']?.toString(),
    plan:      j['plan']?.toString()      ?? 'free',
    isOnline:  j['isOnline'] == true || j['is_online'] == true,
    lastSeen:  j['lastSeen']?.toString()  ?? j['last_seen']?.toString(),
    locale:    j['locale']?.toString()    ?? 'en',
    role:      j['role']?.toString()      ?? 'user',
  );

  final String  id;
  final String  name;
  final String  email;
  final String  username;
  final String  bio;
  final String? avatarUrl;
  final String  plan;
  final bool    isOnline;
  final String? lastSeen;
  final String  locale;
  final String  role;

  bool get isPremium => plan == 'premium';
  String get initials => name.isNotEmpty ? name[0].toUpperCase() : '?';

  AppUser copyWith({String? name, String? bio, String? avatarUrl, bool? isOnline}) => AppUser(
    id: id, email: email, username: username, plan: plan,
    lastSeen: lastSeen, locale: locale, role: role,
    name: name ?? this.name,
    bio: bio ?? this.bio,
    avatarUrl: avatarUrl ?? this.avatarUrl,
    isOnline: isOnline ?? this.isOnline,
  );
}
