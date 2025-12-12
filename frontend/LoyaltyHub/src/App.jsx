import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainPage from "./MainPage";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import RedemptionRequest from "./pages/RedemptionRequest";
import Layout from "./layout/Layout";
import { AuthProvider } from "./contexts/AuthProvider";

// Scroll to top
import ScrollToTop from "./utils/ScrollToTop";

// Protected Route
import ProtectedRoute from "./components/ProtectedRoute";

// User routes
import UserPoints from "./pages/user/Points";
import UserQR from "./pages/user/QR";
import UserTransfer from "./pages/user/Transfer";
import RedemptionQR from "./pages/user/RedemptionQR";
import UserPromotions from "./pages/user/Promotions";
import UserEvents from "./pages/user/Events";
import UserEventDetail from "./pages/user/EventDetail";
import UserTransactions from "./pages/user/Transactions";

// Cashier routes
import TransactionCreate from "./pages/cashier/TransactionCreate";
import RedemptionProcess from "./pages/cashier/RedemptionProcess";

// Manager routes
import ManagerUsers from "./pages/manager/Users";
import ManagerUserDetail from "./pages/manager/UserDetail";
import ManagerTransactions from "./pages/manager/Transactions";
import ManagerTransactionDetail from "./pages/manager/TransactionDetail";
import ManagerPromotions from "./pages/manager/Promotions";
import PromotionCreate from "./pages/manager/PromotionCreate";
import PromotionDetail from "./pages/manager/PromotionDetail";
import ManagerEvents from "./pages/manager/Events";
import ManagerEventCreate from "./pages/manager/EventCreate";
import ManagerEventDetail from "./pages/manager/EventDetail";
import EventMembers from "./pages/manager/EventMembers";

// Event Organizer routes
import EventOrganizerEvents from "./pages/event-organizer/Events";
import EventOrganizerEventDetail from "./pages/event-organizer/EventDetail";
import AddUser from "./pages/event-organizer/AddUser";
import AwardPoints from "./pages/event-organizer/AwardPoints";

// Superuser routes
import Promote from "./pages/superuser/Promote";

// Public User
import PublicUser from "./pages/Public/PublicUser";
import PublicRedemption from "./pages/Public/PublicRedemption";

function App() {
	return (
		<BrowserRouter>
			<AuthProvider>
				<ScrollToTop />
				<Routes>
					<Route path="/public/profile/:data" element={<PublicUser />} />
					<Route
						path="/public/redemption/:transactionId"
						element={<PublicRedemption />}
					/>
					<Route element={<Layout />}>
						{/* User routes */}
						<Route
							path="/user/points"
							element={
								<ProtectedRoute>
									<UserPoints />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/user/qr"
							element={
								<ProtectedRoute>
									<UserQR />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/user/redemption/:transactionId/qr"
							element={
								<ProtectedRoute>
									<RedemptionQR />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/user/redemption/request"
							element={
								<ProtectedRoute>
									<RedemptionRequest />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/user/transfer"
							element={
								<ProtectedRoute>
									<UserTransfer />
								</ProtectedRoute>
							}
						/>
						<Route path="/user/promotions" element={<UserPromotions />} />
						<Route
							path="/user/events"
							element={
								<ProtectedRoute>
									<UserEvents />
								</ProtectedRoute>
							}
						/>
						<Route path="/user/events/:id" element={<UserEventDetail />} />
						<Route
							path="/user/transactions"
							element={
								<ProtectedRoute>
									<UserTransactions />
								</ProtectedRoute>
							}
						/>

						{/* Cashier routes */}
						<Route
							path="/cashier/transaction/create"
							element={
								<ProtectedRoute>
									<TransactionCreate />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/cashier/redemption/process"
							element={
								<ProtectedRoute>
									<RedemptionProcess />
								</ProtectedRoute>
							}
						/>

						{/* Manager routes */}
						<Route
							path="/manager/users"
							element={
								<ProtectedRoute>
									<ManagerUsers />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/manager/users/:id"
							element={
								<ProtectedRoute>
									<ManagerUserDetail />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/manager/transactions"
							element={
								<ProtectedRoute>
									<ManagerTransactions />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/manager/transactions/:id"
							element={
								<ProtectedRoute>
									<ManagerTransactionDetail />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/manager/promotions"
							element={
								<ProtectedRoute>
									<ManagerPromotions />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/manager/promotions/create"
							element={
								<ProtectedRoute>
									<PromotionCreate />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/manager/promotions/:id"
							element={
								<ProtectedRoute>
									<PromotionDetail />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/manager/events"
							element={
								<ProtectedRoute>
									<ManagerEvents />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/manager/events/create"
							element={
								<ProtectedRoute>
									<ManagerEventCreate />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/manager/events/:id"
							element={
								<ProtectedRoute>
									<ManagerEventDetail />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/manager/events/:id/members"
							element={
								<ProtectedRoute>
									<EventMembers />
								</ProtectedRoute>
							}
						/>

						{/* Event Organizer routes */}
						<Route
							path="/event-organizer/events"
							element={
								<ProtectedRoute>
									<EventOrganizerEvents />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/event-organizer/events/:id"
							element={
								<ProtectedRoute>
									<EventOrganizerEventDetail />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/event-organizer/events/:id/add-user"
							element={
								<ProtectedRoute>
									<AddUser />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/event-organizer/events/:id/award-points"
							element={
								<ProtectedRoute>
									<AwardPoints />
								</ProtectedRoute>
							}
						/>

						{/* Superuser routes */}
						<Route path="/superuser/promote" element={<Promote />} />

						<Route
							path="/"
							element={
								<ProtectedRoute>
									<MainPage />
								</ProtectedRoute>
							}
						/>

						<Route path="/login" element={<Login />} />
						<Route
							path="/profile"
							element={
								<ProtectedRoute>
									<Profile />
								</ProtectedRoute>
							}
						/>
						<Route path="*" element={<Navigate to="/" replace />} />
					</Route>
				</Routes>
			</AuthProvider>
		</BrowserRouter>
	);
}

export default App;
