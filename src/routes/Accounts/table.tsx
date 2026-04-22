import { useState } from "react";
import { useLang } from "@/hooks/useLang";
import { NewAccount } from "./Forms/steps/NewAccount";

type Account = {
    id: string;
    client?: string;
    platformName?: string;
    userName?: string;
    password?: string;
    twoFactorMethod?: "mail" | "phone" | "non";
    mail?: string;
    phoneOwnerName?: string;
    phoneNumber?: string;
    note?: string;
    mailPassword?: string;
    createdAt: Date;
};

type EditingAccount = {
    id: string;
    [key: string]: any;
};

const AccountsPage = () => {
	const { t, lang } = useLang();
	const [accounts, setAccounts] = useState<Account[]>([]);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingData, setEditingData] = useState<EditingAccount | null>(null);
	
	const tr = (key: string, fallback: string) => {
		const value = t(key);
		return !value || value === key ? fallback : value;
	};

	const handleCreateAccount = (data: any) => {
		const newAccount: Account = {
			id: Date.now().toString(),
			...data,
			createdAt: new Date(),
		};
		
		setAccounts(prevAccounts => [newAccount, ...prevAccounts]);
		console.log("Account created:", newAccount);
	};

	const handleEdit = (account: Account) => {
		setEditingId(account.id);
		setEditingData({ ...account });
	};

	const handleEditChange = (field: string, value: string) => {
		if (editingData) {
			setEditingData({
				...editingData,
				[field]: value
			});
		}
	};

	const handleSaveEdit = () => {
		if (editingData && editingId) {
			setAccounts(prevAccounts => 
				prevAccounts.map(account => 
					account.id === editingId 
						? { ...editingData as Account, createdAt: account.createdAt }
						: account
				)
			);
			setEditingId(null);
			setEditingData(null);
		}
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditingData(null);
	};

	const handleDelete = (id: string) => {
		if (confirm("Are you sure you want to delete this account?")) {
			setAccounts(prevAccounts => prevAccounts.filter(account => account.id !== id));
		}
	};

	const getTwoFactorDisplay = (method: string | undefined) => {
		switch(method) {
			case "mail": return "📧 Mail";
			case "phone": return "📱 Phone";
			default: return "❌ None";
		}
	};

	return (
		<div className="space-y-6 px-4 sm:px-6 lg:px-8">
			<section className="relative overflow-hidden rounded-3xl border border-light-200/70 bg-white/90 p-6 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/65 sm:p-8">
				<div className="absolute -top-20 -right-10 h-52 w-52 rounded-full bg-light-400/20 blur-3xl dark:bg-light-500/10" />
				<div className="relative flex flex-col gap-2">
					<span className="inline-flex w-fit items-center rounded-full border border-light-300/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-light-700 dark:border-dark-600 dark:bg-dark-900/70 dark:text-dark-200">
						{tr("accounts", "Accounts")}
					</span>
					<h1 className="title text-2xl sm:text-3xl">{tr("accounts", "Accounts")}</h1>
					<p className="text-light-600 dark:text-dark-300 text-sm sm:text-base">
						{tr("manage_accounts_sub", "Manage accounts and onboarding forms for clients")}
					</p>
					<NewAccount onSubmit={handleCreateAccount} />
				</div>
			</section>

			<section className="rounded-3xl border border-light-200/80 bg-white/90 p-5 shadow-sm dark:border-dark-700/80 dark:bg-dark-900/70 sm:p-6">
				<div className="mb-4">
					<h2 className="text-light-900 dark:text-dark-50 text-lg font-semibold">
						{tr("accounts_list", "Accounts List")}
					</h2>
					<p className="text-light-600 dark:text-dark-400 text-sm">
						{accounts.length === 0 
							? tr("accounts_placeholder", "No accounts yet — use Create Account to begin.")
							: `${accounts.length} account(s) created`}
					</p>
				</div>
				
				{accounts.length === 0 ? (
					<div className="rounded-lg border border-dashed border-light-200/50 p-6 text-center text-sm text-light-600 dark:text-dark-400">
						{tr("accounts_empty", "No accounts to display.")}
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm text-left text-light-700 dark:text-dark-300">
							<thead className="text-xs uppercase bg-light-100 dark:bg-dark-800 rounded-lg">
								<tr>
									<th className="px-4 py-3">Client</th>
									<th className="px-4 py-3">Platform</th>
									<th className="px-4 py-3">Username</th>
									<th className="px-4 py-3">Password</th>
									<th className="px-4 py-3">2FA Method</th>
									<th className="px-4 py-3">Contact Info</th>
									<th className="px-4 py-3">Created At</th>
									<th className="px-4 py-3">Actions</th>
								</tr>
							</thead>
							<tbody>
								{accounts.map((account) => (
									<tr key={account.id} className="border-b border-light-200 dark:border-dark-700 hover:bg-light-50 dark:hover:bg-dark-800/50">
										{editingId === account.id ? (
											// Edit mode
											<>
												<td className="px-4 py-3">
													<input
														type="text"
														value={editingData?.client || ""}
														onChange={(e) => handleEditChange("client", e.target.value)}
														className="w-full px-2 py-1 border rounded dark:bg-dark-800 dark:border-dark-700"
														placeholder="Client"
													/>
												</td>
												<td className="px-4 py-3">
													<input
														type="text"
														value={editingData?.platformName || ""}
														onChange={(e) => handleEditChange("platformName", e.target.value)}
														className="w-full px-2 py-1 border rounded dark:bg-dark-800 dark:border-dark-700"
														placeholder="Platform"
													/>
												</td>
												<td className="px-4 py-3">
													<input
														type="text"
														value={editingData?.userName || ""}
														onChange={(e) => handleEditChange("userName", e.target.value)}
														className="w-full px-2 py-1 border rounded dark:bg-dark-800 dark:border-dark-700"
														placeholder="Username"
													/>
												</td>
												<td className="px-4 py-3">
													<input
														type="text"
														value={editingData?.password || ""}
														onChange={(e) => handleEditChange("password", e.target.value)}
														className="w-full px-2 py-1 border rounded dark:bg-dark-800 dark:border-dark-700"
														placeholder="Password"
													/>
												</td>
												<td className="px-4 py-3">
													<select
														value={editingData?.twoFactorMethod || "non"}
														onChange={(e) => handleEditChange("twoFactorMethod", e.target.value as "mail" | "phone" | "non")}
														className="w-full px-2 py-1 border rounded dark:bg-dark-800 dark:border-dark-700"
													>
														<option value="non">None</option>
														<option value="mail">Mail</option>
														<option value="phone">Phone</option>
													</select>
												</td>
												<td className="px-4 py-3">
													{editingData?.twoFactorMethod === "mail" && (
														<div className="space-y-1">
															<input
																type="email"
																value={editingData?.mail || ""}
																onChange={(e) => handleEditChange("mail", e.target.value)}
																className="w-full px-2 py-1 border rounded dark:bg-dark-800 dark:border-dark-700 text-xs"
																placeholder="Email"
															/>
															<input
																type="text"
																value={editingData?.mailPassword || ""}
																onChange={(e) => handleEditChange("mailPassword", e.target.value)}
																className="w-full px-2 py-1 border rounded dark:bg-dark-800 dark:border-dark-700 text-xs"
																placeholder="Email Password"
															/>
														</div>
													)}
													{editingData?.twoFactorMethod === "phone" && (
														<div className="space-y-1">
															<input
																type="text"
																value={editingData?.phoneOwnerName || ""}
																onChange={(e) => handleEditChange("phoneOwnerName", e.target.value)}
																className="w-full px-2 py-1 border rounded dark:bg-dark-800 dark:border-dark-700 text-xs"
																placeholder="Owner Name"
															/>
															<input
																type="tel"
																value={editingData?.phoneNumber || ""}
																onChange={(e) => handleEditChange("phoneNumber", e.target.value)}
																className="w-full px-2 py-1 border rounded dark:bg-dark-800 dark:border-dark-700 text-xs"
																placeholder="Phone Number"
															/>
														</div>
													)}
													{editingData?.twoFactorMethod === "non" && <span className="text-light-400">-</span>}
												</td>
												<td className="px-4 py-3 text-xs">
													{account.createdAt.toLocaleDateString()}
												</td>
												<td className="px-4 py-3">
													<div className="flex gap-2">
														<button
															onClick={handleSaveEdit}
															className="text-green-600 hover:text-green-700 dark:text-green-400"
														>
															Save
														</button>
														<button
															onClick={handleCancelEdit}
															className="text-gray-600 hover:text-gray-700 dark:text-gray-400"
														>
															Cancel
														</button>
													</div>
												</td>
											</>
										) : (
											// View mode
											<>
												<td className="px-4 py-3 font-medium">{account.client || "-"}</td>
												<td className="px-4 py-3">{account.platformName || "-"}</td>
												<td className="px-4 py-3">{account.userName || "-"}</td>
												<td className="px-4 py-3 font-mono text-sm">{account.password || "-"}</td>
												<td className="px-4 py-3">{getTwoFactorDisplay(account.twoFactorMethod)}</td>
												<td className="px-4 py-3">
													{account.twoFactorMethod === "mail" && account.mail && (
														<div className="text-sm">
															<div>📧 {account.mail}</div>
															{account.mailPassword && <div className="text-xs">🔑 {account.mailPassword}</div>}
														</div>
													)}
													{account.twoFactorMethod === "phone" && account.phoneNumber && (
														<div className="text-sm">
															<div>📱 {account.phoneNumber}</div>
															{account.phoneOwnerName && <div className="text-xs">👤 {account.phoneOwnerName}</div>}
														</div>
													)}
													{account.twoFactorMethod === "non" && <span className="text-light-400">-</span>}
												</td>
												<td className="px-4 py-3 text-xs">
													{account.createdAt.toLocaleDateString()}
												</td>
												<td className="px-4 py-3">
													<div className="flex gap-2">
														<button
															onClick={() => handleEdit(account)}
															className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
														>
															Edit
														</button>
														<button
															onClick={() => handleDelete(account.id)}
															className="text-red-600 hover:text-red-700 dark:text-red-400"
														>
															Delete
														</button>
													</div>
												</td>
											</>
										)}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>
		</div>
	);
};

export default AccountsPage;