import SwiftUI

struct ChatListView: View {
    let onSignOut: () -> Void
    @State private var conversations: [Conversation] = []
    @State private var search = ""
    @State private var selected: Conversation?
    @State private var isLoading = true
    @State private var error = ""
    @State private var selectedTab = "Chats"
    @State private var presenceSocket: URLSessionWebSocketTask?
    @State private var serverOnline = false
    @State private var pulse = false
    @State private var selectedFilter = "All"
    @State private var showContent = false
    @State private var showNotifications = false
    @State private var showNewChat = false

    private var filtered: [Conversation] {
        let byFilter = selectedFilter == "All" ? conversations : conversations.filter { selectedFilter == "Groups" ? $0.type == "group" || $0.type == "channel" : $0.type == "direct" }
        guard !search.isEmpty else { return byFilter }
        return byFilter.filter { ($0.name ?? "").localizedCaseInsensitiveContains(search) }
    }

    init(onSignOut: @escaping () -> Void = {}) {
        self.onSignOut = onSignOut
    }

    var body: some View {
        NavigationStack {
            ZStack {
                SabayChatBackground()
                VStack(spacing: 0) {
                    if selectedTab == "Chats" {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Good to see you").font(.caption).foregroundStyle(SabayChatColors.textSecondary)
                                Text("SabayChart").font(.title2.bold()).foregroundStyle(.white)
                            }
                            Spacer()
                            HStack(spacing: 6) {
                                Circle().fill(serverOnline ? SabayChatColors.success : .red).frame(width: 7, height: 7).scaleEffect(pulse ? 1.35 : 1)
                                Text(serverOnline ? "Live" : "Offline").font(.caption2).foregroundStyle(SabayChatColors.textSecondary)
                            }
                            .padding(.horizontal, 10).padding(.vertical, 7)
                            .background(.white.opacity(0.08)).clipShape(Capsule())
                            Button { showNotifications = true } label: { Image(systemName: "bell.badge").font(.title3).foregroundStyle(.white) }.buttonStyle(.plain)
                        }.padding(.horizontal, 20).padding(.top, 16).padding(.bottom, 12)
                        HStack(spacing: 8) {
                            filterButton("All", icon: "bubble.left.and.bubble.right.fill")
                            filterButton("Personal", icon: "person.fill")
                            filterButton("Groups", icon: "person.3.fill")
                        }.frame(maxWidth: .infinity, alignment: .leading).padding(.horizontal, 20).padding(.bottom, 12)
                        HStack(spacing: 10) {
                            Image(systemName: "magnifyingglass").foregroundStyle(SabayChatColors.textSecondary)
                            TextField("Search chats, groups, and people...", text: $search).foregroundStyle(.white).tint(SabayChatColors.primary)
                            if !search.isEmpty { Button { search = "" } label: { Image(systemName: "xmark.circle.fill").foregroundStyle(SabayChatColors.textSecondary) }.buttonStyle(.plain) }
                        }.padding(13).sabayGlass(cornerRadius: 14).padding(.horizontal, 20).padding(.bottom, 8)
                        if isLoading { ProgressView().tint(.white).frame(maxHeight: .infinity) }
                        else if !error.isEmpty { state(title: "Could not load chats", detail: error); if error.contains("session") { Button("Log in again") { onSignOut() }.buttonStyle(.borderedProminent) } }
                        else if filtered.isEmpty { state(title: "No chats yet", detail: "Start a conversation to see it here.") }
                        else {
                            ScrollView {
                                LazyVStack(spacing: 10) {
                                    ForEach(Array(filtered.enumerated()), id: \.element.id) { index, item in
                                        Button { withAnimation(.spring(response: 0.35, dampingFraction: 0.82)) { selected = item } } label: { row(item) }
                                            .buttonStyle(.plain)
                                            .opacity(showContent ? 1 : 0)
                                            .offset(y: showContent ? 0 : 14)
                                            .animation(.easeOut(duration: 0.35).delay(Double(index) * 0.045), value: showContent)
                                    }
                                }.padding(.horizontal, 16).padding(.vertical, 8)
                            }.refreshable { await load() }
                        }
                    } else {
                        UtilityView(title: selectedTab)
                    }
                    HStack { tab("bubble.left.and.bubble.right.fill", "Chats", selectedTab == "Chats"); tab("person.2", "Contacts", selectedTab == "Contacts"); tab("phone", "Calls", selectedTab == "Calls"); tab("gearshape", "Settings", selectedTab == "Settings") }.padding(.top, 12).padding(.bottom, 8).background(.ultraThinMaterial)
                }
                if selectedTab == "Chats" {
                    VStack {
                        Spacer()
                        HStack {
                            Spacer()
                            Button { showNewChat = true } label: {
                                Image(systemName: "plus").font(.title2.bold()).foregroundStyle(.white).frame(width: 58, height: 58).background(LinearGradient(colors: [SabayChatColors.primary, SabayChatColors.primaryDark], startPoint: .topLeading, endPoint: .bottomTrailing)).clipShape(Circle()).shadow(color: SabayChatColors.primary.opacity(0.42), radius: 14, y: 7)
                            }.buttonStyle(SabayPrimaryButtonStyle()).padding(.trailing, 20).padding(.bottom, 76)
                        }
                    }
                }
            }.task { await load(); await checkServer(); connectPresence(); pulse = true; withAnimation { showContent = true } }.onDisappear { presenceSocket?.cancel(with: .goingAway, reason: nil) }.navigationDestination(item: $selected) { ConversationView(conversation: $0) }
            .sheet(isPresented: $showNotifications) { NotificationCenterView() }
            .sheet(isPresented: $showNewChat) { NewChatView() }
        }.preferredColorScheme(.dark)
    }

    private func row(_ item: Conversation) -> some View {
        HStack(spacing: 14) {
            ZStack { Circle().fill(LinearGradient(colors: [SabayChatColors.primary, SabayChatColors.primaryDark], startPoint: .topLeading, endPoint: .bottomTrailing)); Text(String((item.name ?? "?").prefix(1)).uppercased()).font(.headline).foregroundStyle(.white) }.frame(width: 52, height: 52).shadow(color: SabayChatColors.primary.opacity(0.25), radius: 8)
            VStack(alignment: .leading, spacing: 5) { Text(item.name ?? "Conversation").font(.headline).foregroundStyle(.white); Text(item.lastMessage?.text ?? "No messages yet").font(.subheadline).foregroundStyle(SabayChatColors.textSecondary).lineLimit(1) }
            Spacer(); VStack(alignment: .trailing, spacing: 7) { Text(String(item.updatedAt.split(separator: "T").last?.prefix(5) ?? "")).font(.caption).foregroundStyle(SabayChatColors.textSecondary); Image(systemName: "chevron.right").font(.caption2).foregroundStyle(SabayChatColors.textSecondary) }
        }.padding(14).sabayGlass(cornerRadius: 18)
    }
    private func filterButton(_ title: String, icon: String) -> some View { Button { withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) { selectedFilter = title } } label: { Label(title, systemImage: icon).font(.caption.bold()).foregroundStyle(selectedFilter == title ? .white : SabayChatColors.textSecondary).padding(.horizontal, 12).padding(.vertical, 8).background(selectedFilter == title ? SabayChatColors.primary : SabayChatColors.surface).clipShape(Capsule()) }.buttonStyle(.plain) }
    private func tab(_ icon: String, _ title: String, _ active: Bool) -> some View { Button { withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) { selectedTab = title } } label: { VStack(spacing: 4) { Image(systemName: icon).font(.headline).symbolEffect(.bounce, value: active); Text(title).font(.caption2) }.foregroundStyle(active ? SabayChatColors.primary : SabayChatColors.textSecondary).frame(maxWidth: .infinity) }.buttonStyle(.plain) }
    private func state(title: String, detail: String) -> some View { VStack(spacing: 10) { Image(systemName: "bubble.left.and.bubble.right").font(.system(size: 34)); Text(title).font(.headline); Text(detail).font(.subheadline).multilineTextAlignment(.center).foregroundStyle(SabayChatColors.textSecondary) }.foregroundStyle(.white).padding().frame(maxHeight: .infinity) }
    private func load() async { do { guard let token = keychainToken() else { throw APIError.sessionExpired }; var request = URLRequest(url: URL(string: "https://chart-ztyk.onrender.com/api/conversations")!); request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization"); let (data, response) = try await URLSession.shared.data(for: request); let status = (response as? HTTPURLResponse)?.statusCode ?? 0; guard status == 200 else { throw status == 401 ? APIError.sessionExpired : APIError.server }; conversations = try JSONDecoder().decode([Conversation].self, from: data); error = "" } catch let caughtError { error = caughtError is APIError && (caughtError as? APIError) == .sessionExpired ? "Your session expired. Please log in again." : "Could not connect to SabayChart. Pull down to try again." }; isLoading = false }
    private func connectPresence() { guard let token = keychainToken(), let url = URL(string: "wss://chart-ztyk.onrender.com/ws?token=\(token)") else { return }; presenceSocket = URLSession.shared.webSocketTask(with: url); presenceSocket?.resume() }
    private func checkServer() async { guard let url = URL(string: "https://chart-ztyk.onrender.com/health") else { return }; serverOnline = (try? await URLSession.shared.data(from: url)) != nil }
}

private struct UtilityView: View {
    let title: String
    @State private var friendEmail = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var currentPassword = ""
    @State private var newPassword = ""
    @State private var notice = ""
    @State private var contacts: [Contact] = []
    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text(title).font(.largeTitle.bold()).foregroundStyle(.white)
            if title == "Contacts" {
                Text("People you can chat with").foregroundStyle(SabayChatColors.textSecondary)
                HStack { TextField("Friend email", text: $friendEmail).textInputAutocapitalization(.never).keyboardType(.emailAddress).padding(12).background(SabayChatColors.surface).clipShape(RoundedRectangle(cornerRadius: 12)); Button { Task { await addFriend() } } label: { Image(systemName: "plus").foregroundStyle(.white).padding(12).background(SabayChatColors.primary).clipShape(Circle()) } }
                if contacts.isEmpty { Text("No contacts yet.").foregroundStyle(SabayChatColors.textSecondary) }
                else { ForEach(contacts) { contact in Label(contact.name, systemImage: contact.isOnline ? "circle.fill" : "person.crop.circle.fill").foregroundStyle(contact.isOnline ? SabayChatColors.success : .white) } }
            }

            private struct NotificationCenterView: View {
                @Environment(\.dismiss) private var dismiss
                var body: some View {
                    NavigationStack {
                        ZStack {
                            SabayChatBackground()
                            VStack(spacing: 14) {
                                notification(icon: "person.crop.circle.badge.plus", title: "Your inbox is ready", detail: "Friend requests and mentions will appear here.", color: SabayChatColors.primary)
                                notification(icon: "checkmark.shield.fill", title: "Your account is protected", detail: "Keep your sessions and password secure.", color: SabayChatColors.success)
                                Spacer()
                            }.padding(20)
                        }.navigationTitle("Notifications").toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Done") { dismiss() } } }
                    }.preferredColorScheme(.dark)
                }
                private func notification(icon: String, title: String, detail: String, color: Color) -> some View {
                    HStack(spacing: 14) {
                        Image(systemName: icon).font(.title3).foregroundStyle(color).frame(width: 42, height: 42).background(color.opacity(0.14)).clipShape(Circle())
                        VStack(alignment: .leading, spacing: 4) { Text(title).font(.headline).foregroundStyle(.white); Text(detail).font(.subheadline).foregroundStyle(SabayChatColors.textSecondary) }
                        Spacer()
                    }.padding(16).sabayGlass(cornerRadius: 18)
                }
            }

            private struct NewChatView: View {
                @Environment(\.dismiss) private var dismiss
                @State private var search = ""
                @State private var showComingSoon = false
                var body: some View {
                    NavigationStack {
                        ZStack {
                            SabayChatBackground()
                            VStack(spacing: 14) {
                                Text("Start something new").font(.title2.bold()).foregroundStyle(.white).frame(maxWidth: .infinity, alignment: .leading)
                                Text("Connect with someone or create a space for your team.").font(.subheadline).foregroundStyle(SabayChatColors.textSecondary).frame(maxWidth: .infinity, alignment: .leading)
                                HStack { Image(systemName: "magnifyingglass").foregroundStyle(SabayChatColors.textSecondary); TextField("Search by username or email", text: $search).foregroundStyle(.white) }.padding(14).sabayGlass(cornerRadius: 16)
                                quickAction("person.badge.plus", "New contact", "Find someone by username or email", SabayChatColors.primary)
                                quickAction("person.3.fill", "New group", "Bring your friends together", .purple)
                                quickAction("megaphone.fill", "New channel", "Share updates with your community", .orange)
                                Spacer()
                            }.padding(20)
                        }.navigationTitle("New chat").toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Close") { dismiss() } } }.alert("Almost ready", isPresented: $showComingSoon) { Button("OK", role: .cancel) {} } message: { Text("This action will connect to your SabayChat server when contact, group, and channel creation endpoints are enabled.") }
                    }.preferredColorScheme(.dark)
                }
                private func quickAction(_ icon: String, _ title: String, _ detail: String, _ color: Color) -> some View {
                    Button { showComingSoon = true } label: {
                        HStack(spacing: 14) {
                            Image(systemName: icon).font(.title3).foregroundStyle(color).frame(width: 44, height: 44).background(color.opacity(0.14)).clipShape(Circle())
                            VStack(alignment: .leading, spacing: 3) { Text(title).font(.headline).foregroundStyle(.white); Text(detail).font(.caption).foregroundStyle(SabayChatColors.textSecondary) }
                            Spacer(); Image(systemName: "chevron.right").foregroundStyle(SabayChatColors.textSecondary)
                        }.padding(15).sabayGlass(cornerRadius: 18)
                    }.buttonStyle(SabayPrimaryButtonStyle())
                }
            }
            else if title == "Calls" { Text("Your call history").foregroundStyle(SabayChatColors.textSecondary); Label("No calls yet", systemImage: "phone") }
            else {
                NavigationLink { ProfileView() } label: { settingRow("person.crop.circle", "Profile details", "Name, email, and account") }
                NavigationLink { SettingsDetailView(title: "FAQ", detail: "Find answers about accounts, chats, and safety.") } label: { settingRow("questionmark.circle", "FAQ", "Help center") }
                NavigationLink { PremiumView() } label: { settingRow("crown.fill", "Premium SabayChart", "Unlock more features") }
                NavigationLink { PremiumView() } label: { settingRow("creditcard.fill", "Buy Premium", "Activate with a license key") }
                NavigationLink { SettingsDetailView(title: "Language", detail: "English / Khmer") } label: { settingRow("globe", "Language", "English") }
                NavigationLink { SettingsDetailView(title: "Privacy and security", detail: "Control your sessions and account security.") } label: { settingRow("lock.shield", "Privacy and security", "Password and device access") }
                NavigationLink { SettingsDetailView(title: "Notifications and sounds", detail: "Choose which alerts and sounds you receive.") } label: { settingRow("bell", "Notifications and sounds", "Messages and calls") }
                NavigationLink { ProfileView() } label: { settingRow("iphone.and.arrow.forward", "Devices", "View active sessions") }
                if !notice.isEmpty { Text(notice).font(.footnote).foregroundStyle(SabayChatColors.textSecondary) }
            }
            if !notice.isEmpty { Text(notice).font(.footnote).foregroundStyle(SabayChatColors.textSecondary) }
            Spacer()
        }.foregroundStyle(.white).padding(24).frame(maxWidth: .infinity, alignment: .leading).task { if title == "Contacts" { await loadContacts() } }
    }

    private func loadContacts() async { guard let token = keychainToken(), let url = URL(string: "https://chart-ztyk.onrender.com/api/contacts") else { return }; var request = URLRequest(url: url); request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization"); guard let (data, _) = try? await URLSession.shared.data(for: request) else { return }; contacts = (try? JSONDecoder().decode([Contact].self, from: data)) ?? [] }
    private func addFriend() async { let email = friendEmail.trimmingCharacters(in: .whitespacesAndNewlines); guard !email.isEmpty, let token = keychainToken(), let url = URL(string: "https://chart-ztyk.onrender.com/api/contacts/requests") else { notice = "Enter an email address."; return }; var request = URLRequest(url: url); request.httpMethod = "POST"; request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization"); request.setValue("application/json", forHTTPHeaderField: "Content-Type"); request.httpBody = try? JSONSerialization.data(withJSONObject: ["email": email]); do { let (_, response) = try await URLSession.shared.data(for: request); notice = (response as? HTTPURLResponse)?.statusCode == 201 ? "Friend request sent." : "Could not send request." } catch { notice = "Could not connect to SabayChart." }; friendEmail = "" }

    private struct Contact: Identifiable, Decodable { let id: String; let name: String; let isOnline: Bool; enum CodingKeys: String, CodingKey { case id, name; case isOnline = "isOnline" } }
}

private extension UtilityView {
    func settingRow(_ icon: String, _ title: String, _ subtitle: String) -> some View {
        HStack(spacing: 14) { Image(systemName: icon).foregroundStyle(SabayChatColors.primary).frame(width: 24); VStack(alignment: .leading, spacing: 3) { Text(title).foregroundStyle(.white); Text(subtitle).font(.caption).foregroundStyle(SabayChatColors.textSecondary) }; Spacer(); Image(systemName: "chevron.right").font(.caption).foregroundStyle(SabayChatColors.textSecondary) }
            .padding(.vertical, 10)
    }
}

private struct SettingsDetailView: View {
    let title: String
    let detail: String
    var body: some View { ZStack { SabayChatColors.background.ignoresSafeArea(); VStack(alignment: .leading, spacing: 16) { Text(title).font(.largeTitle.bold()).foregroundStyle(.white); Text(detail).foregroundStyle(SabayChatColors.textSecondary); Spacer() }.padding(24) }.preferredColorScheme(.dark) }
}

private struct PremiumView: View {
    @State private var licenseKey = ""
    @State private var status = ""
    @State private var isActivating = false

    var body: some View {
        ZStack {
            SabayChatColors.background.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    VStack(alignment: .leading, spacing: 8) {
                        Image(systemName: "crown.fill").font(.system(size: 36)).foregroundStyle(.yellow)
                        Text("Premium SabayChart").font(.largeTitle.bold()).foregroundStyle(.white)
                        Text("Make every conversation feel more personal.").foregroundStyle(SabayChatColors.textSecondary)
                    }
                    VStack(alignment: .leading, spacing: 14) {
                        Text("Included with Premium").font(.headline).foregroundStyle(.white)
                        premiumFeature("phone.and.waveform", "HD voice and video calls")
                        premiumFeature("paintbrush.pointed", "Custom themes and profile badges")
                        premiumFeature("arrow.up.doc", "Larger file uploads")
                        premiumFeature("clock.arrow.circlepath", "Message editing and history")
                        premiumFeature("person.crop.circle.badge.checkmark", "Priority support")
                    }.padding(18).background(SabayChatColors.surface).clipShape(RoundedRectangle(cornerRadius: 18))
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Have a license key?").font(.headline).foregroundStyle(.white)
                        TextField("PREMIUM-XXXX-XXXX", text: $licenseKey)
                            .textInputAutocapitalization(.characters)
                            .autocorrectionDisabled()
                            .padding(14).background(SabayChatColors.background).clipShape(RoundedRectangle(cornerRadius: 12))
                        Button {
                            Task { await activate() }
                        } label: {
                            HStack { Spacer(); if isActivating { ProgressView().tint(.white) } else { Image(systemName: "checkmark.seal.fill"); Text("Activate Premium") }; Spacer() }
                        }.buttonStyle(.borderedProminent).tint(SabayChatColors.primary).disabled(isActivating)
                        if !status.isEmpty { Text(status).font(.footnote).foregroundStyle(status == "Premium activated." ? SabayChatColors.success : .red) }
                    }.padding(18).background(SabayChatColors.surface).clipShape(RoundedRectangle(cornerRadius: 18))
                }.padding(20)
            }
        }.scrollDismissesKeyboard(.interactively).preferredColorScheme(.dark).navigationTitle("Premium").navigationBarTitleDisplayMode(.inline)
    }

    private func premiumFeature(_ icon: String, _ text: String) -> some View {
        Label(text, systemImage: icon).foregroundStyle(.white)
    }

    private func activate() async {
        let value = licenseKey.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !value.isEmpty else { status = "Enter your license key."; return }
        guard let token = keychainToken(), let url = URL(string: "https://chart-ztyk.onrender.com/api/premium/activate") else { status = "Please log in again."; return }
        isActivating = true
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = try? JSONSerialization.data(withJSONObject: ["licenseKey": value])
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            let code = (response as? HTTPURLResponse)?.statusCode ?? 0
            let serverError = try? JSONDecoder().decode(ServerError.self, from: data)
            status = (200..<300).contains(code) ? "Premium activated." : (serverError?.error ?? "License could not be activated.")
        } catch { status = "Could not connect to SabayChart." }
        isActivating = false
    }

    private struct ServerError: Decodable { let error: String }
}

private struct ProfileView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var devices: [String] = []
    var body: some View {
        NavigationStack {
            ZStack {
                SabayChatColors.background.ignoresSafeArea()
                VStack(alignment: .leading, spacing: 14) {
                    let name = UserDefaults.standard.string(forKey: "profileName") ?? "Your profile"
                    let email = UserDefaults.standard.string(forKey: "profileEmail") ?? "Signed-in account"
                    ZStack { Circle().fill(SabayChatColors.primary); Text(String(name.prefix(2)).uppercased()).font(.title.bold()).foregroundStyle(.white) }.frame(width: 88, height: 88)
                    Text(name).font(.title.bold()).foregroundStyle(.white)
                    Text(email).foregroundStyle(SabayChatColors.textSecondary)
                    Divider().overlay(SabayChatColors.border)
                    Label("Account is connected to SabayChart", systemImage: "checkmark.seal.fill").foregroundStyle(SabayChatColors.success)
                    Text("Devices").font(.headline).foregroundStyle(.white).padding(.top, 12)
                    if devices.isEmpty { Text("Loading device activity...").foregroundStyle(SabayChatColors.textSecondary) }
                    else { ForEach(devices, id: \.self) { Label($0, systemImage: "iphone") } }
                    Text("Premium coming soon").font(.headline).foregroundStyle(.white).padding(.top, 12)
                    Text("HD calls, custom themes, larger uploads, and priority support.").foregroundStyle(SabayChatColors.textSecondary)
                    Spacer()
                }.padding(24)
            }.toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Done") { dismiss() }.foregroundStyle(SabayChatColors.primary) } }.task { await loadDevices() }
        }.preferredColorScheme(.dark)
    }

    private func loadDevices() async {
        guard let url = URL(string: "https://chart-ztyk.onrender.com/api/me/devices"), let token = keychainToken() else { return }
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        guard let (data, _) = try? await URLSession.shared.data(for: request), let response = try? JSONDecoder().decode(DeviceResponse.self, from: data) else { return }
        devices = response.devices.map { "\($0.deviceName) (\($0.platform))" }
    }

    private struct DeviceResponse: Decodable { let devices: [Device] }
    private struct Device: Decodable {
        let deviceName: String
        let platform: String
        enum CodingKeys: String, CodingKey { case deviceName = "device_name"; case platform }
    }
}

struct Conversation: Identifiable, Codable, Hashable { let id: String; let name: String?; let participants: [String]; let type: String; let lastMessage: Message?; let updatedAt: String }
struct Message: Identifiable, Codable, Hashable { let id: String; let conversationId: String; let senderId: String; let text: String?; let createdAt: String; let status: String }
private enum APIError: Error, Equatable { case server; case sessionExpired }

struct ConversationView: View {
    let conversation: Conversation
    @State private var messages: [Message] = []
    @State private var draft = ""
    @State private var showMessages = false
    @State private var showChatInfo = false
    @State private var showCallNotice = false
    @FocusState private var focused: Bool
    var body: some View {
        ZStack {
            SabayChatBackground()
            VStack(spacing: 0) {
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 12) {
                        ForEach(Array(messages.enumerated()), id: \.element.id) { index, message in
                            HStack {
                                if message.senderId != "user_1" { bubble(message.text ?? "", mine: false); Spacer() }
                                else { Spacer(); bubble(message.text ?? "", mine: true) }
                            }
                            .opacity(showMessages ? 1 : 0)
                            .offset(y: showMessages ? 0 : 12)
                            .animation(.easeOut(duration: 0.3).delay(Double(index) * 0.035), value: showMessages)
                        }
                    }.padding(.horizontal, 20).padding(.top, 16).padding(.bottom, 12)
                }
                HStack(spacing: 10) {
                    TextField("Type a message...", text: $draft).focused($focused).padding(12).sabayGlass(cornerRadius: 16)
                    Button { send() } label: { Image(systemName: "paperplane.fill").foregroundStyle(.white).padding(13).background(SabayChatColors.primary).clipShape(Circle()).shadow(color: SabayChatColors.primary.opacity(0.35), radius: 8) }
                        .buttonStyle(SabayPrimaryButtonStyle())
                        .disabled(draft.trimmingCharacters(in: .whitespaces).isEmpty)
                }.padding(12).background(.ultraThinMaterial.opacity(0.82))
            }
        }
        .navigationTitle(conversation.name ?? "Chat")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                Button { showCallNotice = true } label: { Image(systemName: "phone.fill") }.buttonStyle(.plain)
                Button { showCallNotice = true } label: { Image(systemName: "video.fill") }.buttonStyle(.plain)
                Button { showChatInfo = true } label: { Image(systemName: "ellipsis") }.buttonStyle(.plain)
            }
        }
        .sheet(isPresented: $showChatInfo) { ChatInfoView(conversation: conversation) }
        .alert("Calls are coming soon", isPresented: $showCallNotice) { Button("OK", role: .cancel) {} } message: { Text("Voice and video calling will be connected to the secure SabayChat call service in the next release.") }
        .task { await load(); withAnimation { showMessages = true } }
        .preferredColorScheme(.dark)
    }

    private struct ChatInfoView: View {
        @Environment(\.dismiss) private var dismiss
        let conversation: Conversation
        var body: some View {
            NavigationStack {
                ZStack {
                    SabayChatBackground()
                    VStack(spacing: 14) {
                        ZStack { Circle().fill(LinearGradient(colors: [SabayChatColors.primary, SabayChatColors.primaryDark], startPoint: .topLeading, endPoint: .bottomTrailing)); Text(String((conversation.name ?? "?").prefix(1)).uppercased()).font(.system(size: 38, weight: .bold)).foregroundStyle(.white) }.frame(width: 96, height: 96).shadow(color: SabayChatColors.primary.opacity(0.35), radius: 18)
                        Text(conversation.name ?? "Conversation").font(.title2.bold()).foregroundStyle(.white)
                        Text(conversation.type.capitalized + " chat").font(.subheadline).foregroundStyle(SabayChatColors.textSecondary)
                        HStack(spacing: 10) {
                            infoAction("bell.slash", "Mute")
                            infoAction("magnifyingglass", "Search")
                            infoAction("photo", "Media")
                        }
                        Spacer()
                    }.padding(24)
                }.navigationTitle("Chat details").toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Done") { dismiss() } } }
            }.preferredColorScheme(.dark)
        }
        private func infoAction(_ icon: String, _ title: String) -> some View {
            Button {} label: { VStack(spacing: 8) { Image(systemName: icon).font(.title3); Text(title).font(.caption) }.foregroundStyle(.white).frame(maxWidth: .infinity).padding(.vertical, 14).sabayGlass(cornerRadius: 16) }.buttonStyle(SabayPrimaryButtonStyle())
        }
    }
    private func bubble(_ text: String, mine: Bool) -> some View { Text(text).foregroundStyle(.white).padding(12).background(mine ? AnyShapeStyle(LinearGradient(colors: [SabayChatColors.primary, SabayChatColors.primaryDark], startPoint: .topLeading, endPoint: .bottomTrailing)) : AnyShapeStyle(.ultraThinMaterial)).clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous)).shadow(color: .black.opacity(0.12), radius: 5, y: 3) }
    private func load() async { guard let url = URL(string: "https://chart-ztyk.onrender.com/api/messages/\(conversation.id)") else { return }; var request = URLRequest(url: url); if let token = keychainToken() { request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }; guard let (data, _) = try? await URLSession.shared.data(for: request) else { return }; messages = (try? JSONDecoder().decode([Message].self, from: data)) ?? [] }
    private func send() { let text = draft.trimmingCharacters(in: .whitespaces); guard !text.isEmpty, let url = URL(string: "https://chart-ztyk.onrender.com/api/messages/\(conversation.id)") else { return }; var request = URLRequest(url: url); request.httpMethod = "POST"; request.setValue("application/json", forHTTPHeaderField: "Content-Type"); if let token = keychainToken() { request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }; request.httpBody = try? JSONSerialization.data(withJSONObject: ["text": text]); URLSession.shared.dataTask(with: request) { data, response, _ in guard (response as? HTTPURLResponse)?.statusCode == 201, let data, let saved = try? JSONDecoder().decode(Message.self, from: data) else { return }; DispatchQueue.main.async { messages.append(saved) } }.resume(); draft = ""; focused = false }
}
