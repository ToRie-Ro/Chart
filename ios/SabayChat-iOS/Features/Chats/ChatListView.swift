import SwiftUI

struct ChatListView: View {
    @State private var conversations: [Conversation] = []
    @State private var search = ""
    @State private var selected: Conversation?
    @State private var isLoading = true
    @State private var error = ""

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
                    }.padding(.horizontal, 20).padding(.top, 16).padding(.bottom, 12)
                    HStack(spacing: 8) {
                        Text("All Chats").font(.caption.bold()).foregroundStyle(.white).padding(.horizontal, 12).padding(.vertical, 8).background(SabayChatColors.primary).clipShape(Capsule())
                        Text("Personal").font(.caption.bold()).foregroundStyle(SabayChatColors.textSecondary).padding(.horizontal, 12).padding(.vertical, 8).background(SabayChatColors.surface).clipShape(Capsule())
                        Text("Groups").font(.caption.bold()).foregroundStyle(SabayChatColors.textSecondary).padding(.horizontal, 12).padding(.vertical, 8).background(SabayChatColors.surface).clipShape(Capsule())
                    }.frame(maxWidth: .infinity, alignment: .leading).padding(.horizontal, 20).padding(.bottom, 12)
                    HStack(spacing: 8) { Image(systemName: "magnifyingglass").foregroundStyle(SabayChatColors.textSecondary); TextField("Search chats, groups, and people...", text: $search).foregroundStyle(.white).tint(SabayChatColors.primary) }.padding(12).background(SabayChatColors.surface).clipShape(RoundedRectangle(cornerRadius: 12)).padding(.horizontal, 20).padding(.bottom, 8)
                    if isLoading { ProgressView().tint(.white).frame(maxHeight: .infinity) }
                    else if !error.isEmpty { state(title: "Could not load chats", detail: error) }
                    else if filtered.isEmpty { state(title: "No chats yet", detail: "Start a conversation to see it here.") }
                    else { ScrollView { LazyVStack(spacing: 0) { ForEach(filtered) { item in Button { selected = item } label: { row(item) }.buttonStyle(.plain) } } }.refreshable { await load() } }
                    HStack { tab("bubble.left.and.bubble.right.fill", "Chats", true); tab("person.2", "Contacts", false); tab("phone", "Calls", false); tab("gearshape", "Settings", false) }.padding(.top, 12).padding(.bottom, 8).background(SabayChatColors.surface)
                }
            }.task { await load() }.navigationDestination(item: $selected) { ConversationView(conversation: $0) }
        }.preferredColorScheme(.dark)
    }

    private func row(_ item: Conversation) -> some View {
        HStack(spacing: 14) {
            ZStack { Circle().fill(SabayChatColors.primary.opacity(0.25)); Text(String((item.name ?? "?").prefix(1)).uppercased()).font(.headline).foregroundStyle(.white) }.frame(width: 52, height: 52)
            VStack(alignment: .leading, spacing: 5) { Text(item.name ?? "Conversation").font(.headline).foregroundStyle(.white); Text(item.lastMessage?.text ?? "No messages yet").font(.subheadline).foregroundStyle(SabayChatColors.textSecondary).lineLimit(1) }
            Spacer(); Text(String(item.updatedAt.split(separator: "T").last?.prefix(5) ?? "")).font(.caption).foregroundStyle(SabayChatColors.textSecondary)
        }.padding(.horizontal, 20).padding(.vertical, 14).overlay(alignment: .bottom) { Divider().overlay(SabayChatColors.border.opacity(0.35)).padding(.leading, 86) }
    }
    private func tab(_ icon: String, _ title: String, _ active: Bool) -> some View { VStack(spacing: 4) { Image(systemName: icon); Text(title).font(.caption2) }.foregroundStyle(active ? SabayChatColors.primary : SabayChatColors.textSecondary).frame(maxWidth: .infinity) }
    private func state(title: String, detail: String) -> some View { VStack(spacing: 10) { Image(systemName: "bubble.left.and.bubble.right").font(.system(size: 34)); Text(title).font(.headline); Text(detail).font(.subheadline).multilineTextAlignment(.center).foregroundStyle(SabayChatColors.textSecondary) }.foregroundStyle(.white).padding().frame(maxHeight: .infinity) }
    private func load() async { do { let (data, response) = try await URLSession.shared.data(from: URL(string: "https://chart-ztyk.onrender.com/api/conversations")!); guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw APIError.server }; conversations = try JSONDecoder().decode([Conversation].self, from: data); error = "" } catch let caughtError { error = caughtError.localizedDescription.isEmpty ? "Check your internet connection and try again." : caughtError.localizedDescription }; isLoading = false }
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
    private func load() async { guard let url = URL(string: "https://chart-ztyk.onrender.com/api/messages/\(conversation.id)"), let (data, _) = try? await URLSession.shared.data(from: url) else { return }; messages = (try? JSONDecoder().decode([Message].self, from: data)) ?? [] }
    private func send() { guard !draft.trimmingCharacters(in: .whitespaces).isEmpty else { return }; messages.append(Message(id: UUID().uuidString, conversationId: conversation.id, senderId: "user_1", text: draft, createdAt: ISO8601DateFormatter().string(from: Date()), status: "sending")); draft = ""; focused = false }
}
