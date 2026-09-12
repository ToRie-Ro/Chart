import SwiftUI

struct ChatListView: View {
    var body: some View {
        NavigationStack {
            List {
                ForEach(0..<4) { index in
                    HStack(spacing: 14) {
                        Circle()
                            .fill(index % 2 == 0 ? Color.blue : Color.gray)
                            .frame(width: 52, height: 52)

                        VStack(alignment: .leading, spacing: 4) {
                            Text(index % 2 == 0 ? "Da Rea" : "Sokha Mean")
                                .font(.headline)
                            Text("Last message in the chat from the design mock.")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }

                        Spacer()

                        VStack(alignment: .trailing, spacing: 4) {
                            Text("9:41")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Circle()
                                .fill(index == 0 ? Color.blue : Color.clear)
                                .frame(width: 10, height: 10)
                        }
                    }
                    .padding(.vertical, 6)
                }
            }
            .navigationTitle("Chats")
        }
    }
}

#Preview {
    ChatListView()
}
