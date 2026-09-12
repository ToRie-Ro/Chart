import SwiftUI
import Security

struct WelcomeView: View {
    @FocusState private var focusedField: Field?
    @State private var mode: AuthMode = .login
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var message = ""
    @State private var isLoading = false
    @State private var isAuthenticated = UserDefaults.standard.bool(forKey: "isAuthenticated")

    private enum AuthMode {
        case login
        case register
    }

    private enum Field: Hashable {
        case name, email, password
    }

    var body: some View {
        Group {
            if isAuthenticated {
                ChatListView()
            } else {
                authenticationView
            }
        }
    }

    private var authenticationView: some View {
        ZStack {
            LinearGradient(
                colors: [SabayChatColors.primary, SabayChatColors.primaryDark],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            ScrollView {
                VStack(alignment: .center, spacing: 20) {
                Spacer(minLength: 24)

                VStack(spacing: 12) {
                    Circle()
                        .frame(width: 72, height: 72)
                        .foregroundStyle(.white.opacity(0.2))
                        .overlay(
                            Image(systemName: "bubble.left.fill")
                                .font(.system(size: 28, weight: .bold))
                                .foregroundStyle(.white)
                        )

                        Text("SabayChart")
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)

                    Text("Made in Cambodia 🇰🇭")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(.white.opacity(0.8))
                }

                Spacer()

                VStack(alignment: .leading, spacing: 16) {
                    Text(mode == .login ? "Login" : "Create account")
                        .font(.largeTitle.weight(.bold))
                        .foregroundStyle(.white)

                    Text("Connect with friends across Cambodia and beyond.")
                        .font(.body)
                        .foregroundStyle(.white.opacity(0.8))

                    if mode == .register {
                        TextField("Name", text: $name)
                            .focused($focusedField, equals: .name)
                            .textContentType(.name)
                            .textInputAutocapitalization(.words)
                            .padding()
                            .background(.white.opacity(0.12))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    TextField("Email", text: $email)
                        .focused($focusedField, equals: .email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .padding()
                        .background(.white.opacity(0.12))
                        .clipShape(RoundedRectangle(cornerRadius: 12))

                    SecureField("Password", text: $password)
                        .focused($focusedField, equals: .password)
                        .textContentType(mode == .login ? .password : .newPassword)
                        .padding()
                        .background(.white.opacity(0.12))
                        .clipShape(RoundedRectangle(cornerRadius: 12))

                    if !message.isEmpty {
                        Text(message)
                            .font(.footnote)
                            .foregroundStyle(.white.opacity(0.9))
                    }

                    Button(action: submit) {
                        Text(isLoading ? "Please wait..." : (mode == .login ? "Login" : "Create account"))
                            .frame(maxWidth: .infinity)
                            .padding()
                            .foregroundStyle(.white)
                            .font(.headline)
                            .background(.white.opacity(0.18))
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                    .disabled(isLoading)

                    Button {
                        mode = mode == .login ? .register : .login
                        message = ""
                    } label: {
                        Text(mode == .login ? "Create account" : "Back to login")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .foregroundStyle(.white)
                            .font(.headline)
                            .background(.white.opacity(0.18))
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                }
                .padding(24)
                .frame(maxWidth: 380)
                .background(Color.white.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .stroke(Color.white.opacity(0.12), lineWidth: 1)
                )

                Spacer(minLength: 20)
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 32)
            }
        }
        .scrollDismissesKeyboard(.interactively)
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Done") { focusedField = nil }
            }
        }
    }

    private func submit() {
        guard !email.isEmpty, !password.isEmpty, mode == .login || !name.isEmpty else {
            message = mode == .login ? "Enter your email and password." : "Enter your name, email, and password."
            return
        }

        isLoading = true
        focusedField = nil
        message = ""
        let endpoint = mode == .login ? "auth/login" : "auth/register"
        guard let url = URL(string: "https://chart-ztyk.onrender.com/api/\(endpoint)") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        var payload = ["email": email, "password": password]
        if mode == .register { payload["name"] = name }
        request.httpBody = try? JSONSerialization.data(withJSONObject: payload)

        URLSession.shared.dataTask(with: request) { data, response, _ in
            let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0
            let serverMessage = data.flatMap { try? JSONDecoder().decode(ServerError.self, from: $0) }?.error
            DispatchQueue.main.async {
                isLoading = false
                if (200..<300).contains(statusCode) {
                    message = mode == .login ? "Login successful." : "Account created successfully."
                    UserDefaults.standard.set(true, forKey: "isAuthenticated")
                    if let data, let auth = try? JSONSerialization.jsonObject(with: data) as? [String: Any], let token = auth["token"] as? String, let user = auth["user"] as? [String: Any] {
                        saveKeychainToken(token)
                        UserDefaults.standard.set(user["name"] as? String, forKey: "profileName")
                        UserDefaults.standard.set(user["email"] as? String, forKey: "profileEmail")
                    }
                    isAuthenticated = true
                } else {
                    message = serverMessage ?? "The server could not complete your request."
                }
            }
        }.resume()
    }

    private struct ServerError: Decodable {
        let error: String
    }
}

#Preview {
    WelcomeView()
}

func saveKeychainToken(_ token: String) {
    let data = Data(token.utf8)
    let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrAccount as String: "sabaychart.authToken", kSecValueData as String: data]
    SecItemDelete(query as CFDictionary)
    SecItemAdd(query as CFDictionary, nil)
}

func keychainToken() -> String? {
    let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrAccount as String: "sabaychart.authToken", kSecReturnData as String: true, kSecMatchLimit as String: kSecMatchLimitOne]
    var result: AnyObject?
    guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess, let data = result as? Data else { return nil }
    return String(data: data, encoding: .utf8)
}
