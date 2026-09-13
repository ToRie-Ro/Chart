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
    @State private var showingWelcome = true
    @State private var isAuthenticated = keychainToken() != nil

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
                ChatListView { isAuthenticated = false }
            } else {
                authenticationView
            }
        }
    }

    private var authenticationView: some View {
        ZStack {
            SabayChatColors.background.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 0) {
                    Spacer(minLength: 62)
                    if showingWelcome {
                        welcomeView
                    } else {
                        accountFormView
                    }
                    Spacer(minLength: 42)
                    Text("MADE IN CAMBODIA 🇰🇭")
                        .font(.caption2.weight(.semibold))
                        .tracking(1.2)
                        .foregroundStyle(SabayChatColors.textSecondary)
                }
                .padding(.horizontal, 24)
                .frame(maxWidth: 440)
                .frame(maxWidth: .infinity)
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

    private var welcomeView: some View {
        VStack(spacing: 22) {
            Image(systemName: "bubble.left.and.bubble.right.fill")
                .font(.system(size: 38, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 82, height: 82)
                .background(SabayChatColors.primary)
                .clipShape(RoundedRectangle(cornerRadius: 25, style: .continuous))
                .shadow(color: SabayChatColors.primary.opacity(0.28), radius: 18, y: 9)
            Text("សួស្តី! Welcome")
                .font(.system(size: 30, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
            Text("Connect with friends across Cambodia securely.")
                .font(.subheadline)
                .foregroundStyle(SabayChatColors.textSecondary)
                .multilineTextAlignment(.center)
            Spacer().frame(height: 8)
            authButton(title: "Create Account", icon: "person.badge.plus", filled: true) {
                mode = .register
                showingWelcome = false
            }
            authButton(title: "Sign In", icon: "arrow.right", filled: false) {
                mode = .login
                showingWelcome = false
            }
        }
    }

    private var accountFormView: some View {
        VStack(alignment: .leading, spacing: 18) {
            Button {
                focusedField = nil
                showingWelcome = true
            } label: {
                Image(systemName: "arrow.left")
                    .font(.headline)
                    .foregroundStyle(.white)
            }.buttonStyle(.plain)
            Text(mode == .register ? "Create Account" : "Sign In")
                .font(.system(size: 29, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
            progressView(step: 1, total: 2)
            Text(mode == .register ? "Enter your details" : "Welcome back")
                .font(.title3.bold())
                .foregroundStyle(.white)
            Text(mode == .register ? "Create your secure SabayChart account." : "Sign in securely to continue to your conversations.")
                .font(.subheadline)
                .foregroundStyle(SabayChatColors.textSecondary)
            if mode == .register {
                authField("Display name", text: $name, icon: "person")
            }
            authField("Email address", text: $email, icon: "envelope", email: true)
            secureAuthField
            if !message.isEmpty {
                Text(message).font(.footnote).foregroundStyle(SabayChatColors.primary)
            }
            Button(action: submit) {
                HStack {
                    Spacer()
                    if isLoading { ProgressView().tint(.white) }
                    Text(isLoading ? "Please wait..." : (mode == .register ? "Create Account" : "Sign In"))
                        .fontWeight(.semibold)
                    Image(systemName: "arrow.right")
                    Spacer()
                }
                .padding(.vertical, 16)
                .foregroundStyle(.white)
                .background(SabayChatColors.primary)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            }
            .disabled(isLoading)
            .buttonStyle(SabayPrimaryButtonStyle())
            Button(mode == .register ? "Already have an account? Sign In" : "New to SabayChart? Create Account") {
                mode = mode == .login ? .register : .login
                message = ""
            }
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(SabayChatColors.primary)
            .frame(maxWidth: .infinity)
        }
    }

    private var secureAuthField: some View {
        SecureField(mode == .register ? "Create secure password" : "Password", text: $password)
            .focused($focusedField, equals: .password)
            .textContentType(mode == .login ? .password : .newPassword)
            .padding(.horizontal, 15)
            .padding(.vertical, 14)
            .foregroundStyle(.white)
            .background(SabayChatColors.surface)
            .overlay(RoundedRectangle(cornerRadius: 13).stroke(.white.opacity(0.10)))
            .clipShape(RoundedRectangle(cornerRadius: 13))
    }

    private func authField(_ placeholder: String, text: Binding<String>, icon: String, email: Bool = false) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon).foregroundStyle(SabayChatColors.textSecondary)
            TextField(placeholder, text: text)
                .focused($focusedField, equals: email ? .email : .name)
                .textContentType(email ? .emailAddress : .name)
                .keyboardType(email ? .emailAddress : .default)
                .textInputAutocapitalization(email ? .never : .words)
                .autocorrectionDisabled(email)
        }
        .padding(.horizontal, 15)
        .padding(.vertical, 14)
        .foregroundStyle(.white)
        .background(SabayChatColors.surface)
        .overlay(RoundedRectangle(cornerRadius: 13).stroke(.white.opacity(0.10)))
        .clipShape(RoundedRectangle(cornerRadius: 13))
    }

    private func progressView(step: Int, total: Int) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("STEP \(step) OF \(total)").font(.caption2.bold()).foregroundStyle(SabayChatColors.primary)
                Spacer()
                Text("\(step * 100 / total)% Complete").font(.caption2).foregroundStyle(SabayChatColors.textSecondary)
            }
            GeometryReader { proxy in
                ZStack(alignment: .leading) {
                    Capsule().fill(SabayChatColors.surface)
                    Capsule().fill(SabayChatColors.primary).frame(width: proxy.size.width * CGFloat(step) / CGFloat(total))
                }
            }.frame(height: 5)
        }
    }

    private func authButton(title: String, icon: String, filled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                Spacer()
                Text(title).fontWeight(.semibold)
                Spacer()
            }
            .padding(.vertical, 16)
            .padding(.horizontal, 18)
            .foregroundStyle(.white)
            .background(filled ? AnyShapeStyle(SabayChatColors.primary) : AnyShapeStyle(SabayChatColors.surface))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(.white.opacity(filled ? 0 : 0.10)))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
        .buttonStyle(SabayPrimaryButtonStyle())
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
        request.timeoutInterval = 35
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        var payload = ["email": email, "password": password]
        if mode == .register { payload["name"] = name }
        request.httpBody = try? JSONSerialization.data(withJSONObject: payload)

        URLSession.shared.dataTask(with: request) { data, response, requestError in
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
                    message = serverMessage ?? requestError?.localizedDescription ?? "The server could not complete your request."
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
