import SwiftUI

struct ChatListView: View {
    @State private var conversations: [Conversation] = []
    @State private var search = ""
    @State private var selected: Conversation?
    @State private var isLoading = true
    @State private var error = ""
    @State private var showProfile = false
    @State private var selectedTab = "Chats"
    @State private var presenceSocket: URLSessionWebSocketTask?

    private var filtered: [Conversation] {
        guard !search.isEmpty else { return conversations }
        return conversations.filter { ($0.name ?? "").localizedCaseInsensitiveContains(search) }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                SabayChatColors.background.ignoresSafeArea()
                VStack(spacing: 0) {
                    HStack {
                        Text("SabayChart").font(.title2.bold()).foregroundStyle(.white)
                        Spacer()
                        Text("KH").font(.caption.bold()).foregroundStyle(.white).padding(7).background(SabayChatColors.primary).clipShape(Circle())
                        Image(systemName: "bell").foregroundStyle(.white)
                        Button { showProfile = true } label: { Image(systemName: "person.crop.circle.fill").foregroundStyle(.white) }
                    }.padding(.horizontal, 20).padding(.top, 16).padding(.bottom, 12)
                    HStack(spacing: 8) {
                        Text("All Chats").font(.caption.bold()).foregroundStyle(.white).padding(.horizontal, 12).padding(.vertical, 8).background(SabayChatColors.primary).clipShape(Capsule())
                        Text("Personal").font(.caption.bold()).foregroundStyle(SabayChatColors.textSecondary).padding(.horizontal, 12).padding(.vertical, 8).background(SabayChatColors.surface).clipShape(Capsule())
                        Text("Groups").font(.caption.bold()).foregroundStyle(SabayChatColors.textSecondary).padding(.horizontal, 12).padding(.vertical, 8).background(SabayChatColors.surface).clipShape(Capsule())
                    }.frame(maxWidth: .infinity, alignment: .leading).padding(.horizontal, 20).padding(.bottom, 12)
                    HStack(spacing: 8) { Image(systemName: "magnifyingglass").foregroundStyle(SabayChatColors.textSecondary); TextField("Search chats, groups, and people...", text: $search).foregroundStyle(.white).tint(SabayChatColors.primary) }.padding(12).background(SabayChatColors.surface).clipShape(RoundedRectangle(cornerRadius: 12)).padding(.horizontal, 20).padding(.bottom, 8)
                    if selectedTab != "Chats" { UtilityView(title: selectedTab) }
                    else if isLoading { ProgressView().tint(.white).frame(maxHeight: .infinity) }
                    else if !error.isEmpty { state(title: "Could not load chats", detail: error) }
                    else if filtered.isEmpty { state(title: "No chats yet", detail: "Start a conversation to see it here.") }
                    else { ScrollView { LazyVStack(spacing: 0) { ForEach(filtered) { item in Button { selected = item } label: { row(item) }.buttonStyle(.plain) } } }.refreshable { await load() } }
                    HStack { tab("bubble.left.and.bubble.right.fill", "Chats", selectedTab == "Chats"); tab("person.2", "Contacts", selectedTab == "Contacts"); tab("phone", "Calls", selectedTab == "Calls"); tab("gearshape", "Settings", selectedTab == "Settings") }.padding(.top, 12).padding(.bottom, 8).background(SabayChatColors.surface)
                }
            }.task { await load(); connectPresence() }.onDisappear { presenceSocket?.cancel(with: .goingAway, reason: nil) }.navigationDestination(item: $selected) { ConversationView(conversation: $0) }
                .sheet(isPresented: $showProfile) { ProfileView() }
        }.preferredColorScheme(.dark)
    }

    private func row(_ item: Conversation) -> some View {
        HStack(spacing: 14) {
            ZStack { Circle().fill(SabayChatColors.primary.opacity(0.25)); Text(String((item.name ?? "?").prefix(1)).uppercased()).font(.headline).foregroundStyle(.white) }.frame(width: 52, height: 52)
            VStack(alignment: .leading, spacing: 5) { Text(item.name ?? "Conversation").font(.headline).foregroundStyle(.white); Text(item.lastMessage?.text ?? "No messages yet").font(.subheadline).foregroundStyle(SabayChatColors.textSecondary).lineLimit(1) }
            Spacer(); Text(String(item.updatedAt.split(separator: "T").last?.prefix(5) ?? "")).font(.caption).foregroundStyle(SabayChatColors.textSecondary)
        }.padding(.horizontal, 20).padding(.vertical, 14).overlay(alignment: .bottom) { Divider().overlay(SabayChatColors.border.opacity(0.35)).padding(.leading, 86) }
    }
    private func tab(_ icon: String, _ title: String, _ active: Bool) -> some View { Button { selectedTab = title } label: { VStack(spacing: 4) { Image(systemName: icon); Text(title).font(.caption2) }.foregroundStyle(active ? SabayChatColors.primary : SabayChatColors.textSecondary).frame(maxWidth: .infinity) }.buttonStyle(.plain) }
    private func state(title: String, detail: String) -> some View { VStack(spacing: 10) { Image(systemName: "bubble.left.and.bubble.right").font(.system(size: 34)); Text(title).font(.headline); Text(detail).font(.subheadline).multilineTextAlignment(.center).foregroundStyle(SabayChatColors.textSecondary) }.foregroundStyle(.white).padding().frame(maxHeight: .infinity) }
    private func load() async { do { var request = URLRequest(url: URL(string: "https://chart-ztyk.onrender.com/api/conversations")!); if let token = keychainToken() { request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }; let (data, response) = try await URLSession.shared.data(for: request); guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw APIError.server }; conversations = try JSONDecoder().decode([Conversation].self, from: data); error = "" } catch let caughtError { error = caughtError.localizedDescription.isEmpty ? "Check your internet connection and try again." : caughtError.localizedDescription }; isLoading = false }
    private func connectPresence() { guard let token = keychainToken(), let url = URL(string: "wss://chart-ztyk.onrender.com/ws?token=\(token)") else { return }; presenceSocket = URLSession.shared.webSocketTask(with: url); presenceSocket?.resume() }
}

private struct UtilityView: View {
    let title: String
    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text(title).font(.largeTitle.bold()).foregroundStyle(.white)
            if title == "Contacts" { Text("People you can chat with").foregroundStyle(SabayChatColors.textSecondary); Label("Da Rea", systemImage: "person.crop.circle.fill"); Label("Sokha Mean", systemImage: "person.crop.circle.fill") }
            else if title == "Calls" { Text("Your call history").foregroundStyle(SabayChatColors.textSecondary); Label("No calls yet", systemImage: "phone") }
            else { Toggle("Notifications", isOn: .constant(true)); Toggle("Dark appearance", isOn: .constant(true)); Label("Connected to SabayChart server", systemImage: "checkmark.circle.fill").foregroundStyle(SabayChatColors.success) }
            Spacer()
        }.foregroundStyle(.white).padding(24).frame(maxWidth: .infinity, alignment: .leading)
    }
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
private enum APIError: Error { case server }

struct ConversationView: View {
    let conversation: Conversation
    @State private var messages: [Message] = []
    @State private var draft = ""
    @FocusState private var focused: Bool
    var body: some View {
        VStack(spacing: 0) {
            ScrollView { LazyVStack(alignment: .leading, spacing: 12) { ForEach(messages) { message in HStack { if message.senderId != "user_1" { bubble(message.text ?? "", mine: false); Spacer() } else { Spacer(); bubble(message.text ?? "", mine: true) } } }.padding(.horizontal, 20).padding(.top, 12) } }
            HStack(spacing: 10) { TextField("Type a message...", text: $draft).focused($focused).padding(12).background(SabayChatColors.surface).clipShape(RoundedRectangle(cornerRadius: 14)); Button { send() } label: { Image(systemName: "paperplane.fill").foregroundStyle(.white).padding(12).background(SabayChatColors.primary).clipShape(Circle()) }.disabled(draft.trimmingCharacters(in: .whitespaces).isEmpty) }.padding(12).background(SabayChatColors.background)
        }.background(SabayChatColors.background.ignoresSafeArea()).navigationTitle(conversation.name ?? "Chat").navigationBarTitleDisplayMode(.inline).task { await load() }.preferredColorScheme(.dark)
    }
    private func bubble(_ text: String, mine: Bool) -> some View { Text(text).foregroundStyle(.white).padding(12).background(mine ? SabayChatColors.primary : SabayChatColors.surface).clipShape(RoundedRectangle(cornerRadius: 16)) }
    private func load() async { guard let url = URL(string: "https://chart-ztyk.onrender.com/api/messages/\(conversation.id)") else { return }; var request = URLRequest(url: url); if let token = keychainToken() { request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }; guard let (data, _) = try? await URLSession.shared.data(for: request) else { return }; messages = (try? JSONDecoder().decode([Message].self, from: data)) ?? [] }
    private func send() { let text = draft.trimmingCharacters(in: .whitespaces); guard !text.isEmpty, let url = URL(string: "https://chart-ztyk.onrender.com/api/messages/\(conversation.id)") else { return }; var request = URLRequest(url: url); request.httpMethod = "POST"; request.setValue("application/json", forHTTPHeaderField: "Content-Type"); if let token = keychainToken() { request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }; request.httpBody = try? JSONSerialization.data(withJSONObject: ["text": text]); URLSession.shared.dataTask(with: request) { data, response, _ in guard (response as? HTTPURLResponse)?.statusCode == 201, let data, let saved = try? JSONDecoder().decode(Message.self, from: data) else { return }; DispatchQueue.main.async { messages.append(saved) } }.resume(); draft = ""; focused = false }
}
