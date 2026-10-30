/**
 * Domain types — mirror the web app's `types/*` and the real backend response
 * shapes so mock and live modes are interchangeable.
 */

export type PostContentType = 'POST' | 'PRODUCT';
export type AuthorType = 'User' | 'Business';

export interface IOperatingHour {
  day: string;
  open: string;
  close: string;
}

export interface BusinessType {
  _id: string;
  businessName: string;
  /** Public web address: www.ura.com.ng/<slug>. */
  slug?: string;
  about: string;
  category: string;
  businessLogo: string;
  businessCover: string;
  contact: { phone?: string; website?: string; email?: string };
  address: { street: string; city: string; state: string; country: string; fullAddress: string };
  averageRating?: number;
  totalReviews?: number;
  followers?: string[];
  operatingHours: IOperatingHour[];
  /** Google visibility settings (web BusinessInfoForm). */
  area?: string;
  showOnGoogle?: boolean;
  hasPhysicalStore?: boolean;
  showStreetAddress?: boolean;
  owner?: string;
}

export interface UserType {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone?: string;
  paylukCustomerId?: string;
  shippingAddress?: { phone?: string; city?: string; state?: string; fullAddress?: string };
  coverPicture?: string;
  isBusinessOwner: boolean;
  profilePicture?: string;
  bio?: string;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  bookmarkedBusinesses: string[];
  bookmarkedPosts: string[];
  savedEvents: string[];
  followingUsers: string[];
  followingBusinesses: string[];
  followers: string[];
  business: BusinessType | null;
  createdAt: string;
  updatedAt: string;
}

/** GET /users/me `related`: the shop(s) this person owns, and their counts. */
export interface RelatedData {
  business_id: string | null;
  /** Selected fields only: businessName businessLogo businessCover followers likes category address contact. */
  businesses: Partial<BusinessType>[];
  counts: { posts: number; followers: number; following: number };
}

export interface CurrentUserResponse {
  success: boolean;
  message?: string;
  /** `user.business` is filled in by the app from `related.businesses[0]` (the API has no such field). */
  user: UserType;
  related: RelatedData;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: { accessToken: string; refreshToken: string };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

export interface UsernameCheckResponse {
  available: boolean;
  message: string;
}

/** Product embedded in a product feed post. */
export interface ProductEntity {
  _id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description: string;
  size?: string;
  media: string[];
  business: string;
  likes: string[];
  averageRating?: number;
  reviewCount?: number;
}

/** Unified feed item — a social post or a product. */
export interface UnifiedPost {
  _id: string;
  type: PostContentType;
  authorType: AuthorType;
  authorId: string;
  displayName: string;
  displayAvatar: string | null;
  username: string | null;
  isVerified: boolean;
  caption: string;
  media: string[];
  /** Parallel to `media`: which entries are videos vs images. */
  mediaTypes?: ('image' | 'video')[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  /** The shop's web address slug (www.ura.com.ng/<slug>), when the author is a business. */
  businessSlug?: string;
  product?: ProductEntity;
  // Flat fallbacks present on some product posts
  productName?: string;
  category?: string;
  name?: string;
  price?: number;
  stock?: number;
}

export interface FeedResponse {
  success: boolean;
  posts: UnifiedPost[];
}

export interface Comment {
  _id: string;
  postId: string;
  author: { _id: string; name: string; username: string | null; avatar: string | null };
  content: string;
  likes: string[];
  isLiked: boolean;
  createdAt: string;
}

export interface Review {
  _id: string;
  reviewedItem: string;
  reviewedItemModel: 'Business' | 'Product';
  author: { _id: string; name: string; avatar: string | null };
  rating: number;
  comment: string;
  likes: string[];
  dislikes: string[];
  isLiked: boolean;
  isDisliked: boolean;
  createdAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ReviewsData {
  summary: ReviewSummary;
  reviews: Review[];
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  stock: number;
  business: string;
  businessName: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  totalItems: number;
}

export type DeliveryMethod = 'delivery' | 'pickup';
/** 'normal' = paid straight to the seller; 'protected' = held until the buyer confirms. */
export type PaymentType = 'normal' | 'protected';

/** Backend OrderStatus enum (models/order-model.ts). */
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type OrderPaymentStatus = 'pending' | 'paid' | 'failed';
/** How the order reaches the buyer once the seller marks it ready. */
export type OrderFulfilment = 'fez' | 'pickup' | 'seller_delivery';
export type DisputeStatus = 'open' | 'investigating' | 'refunded' | 'split' | 'resolved';

/** Which buttons apply to an order, decided by the server (services/order-view.service.ts). */
export interface OrderActions {
  pay: boolean;
  cancel: boolean;
  confirmDelivery: boolean;
  reportProblem: boolean;
  getRefund: boolean;
  markReady: boolean;
  reject: boolean;
  claimPayment: boolean;
  respondToProblem: boolean;
}

/** An order as GET /orders and /orders/received return it: no phone numbers (except the shop's, for buyers). */
export interface ListOrder {
  _id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  paymentType: PaymentType;
  deliveryMethod?: DeliveryMethod;
  fulfilment?: OrderFulfilment | null;
  items: { name: string; price: number; quantity: number; image?: string | null }[];
  itemsTotal: number;
  totalAmount: number;
  deliveryFee: number;
  createdAt: string;
  paidAt: string | null;
  autoReleaseAt: string | null;
  payoutReleasedAt: string | null;
  disputeStatus: DisputeStatus | null;
  rejectedAt: string | null;
  trackingNumber: string | null;
  shop: { _id: string; businessName: string; slug?: string; phone?: string | null } | null;
  buyerName: string | null;
  role: 'buyer' | 'seller';
  actions: OrderActions;
  moneyNote: string | null;
}

/** The order document from GET /orders/:id (business, user and items.product populated). */
export interface OrderDetail {
  _id: string;
  orderNumber: string;
  user: { _id: string; firstName?: string; lastName?: string } | string;
  business:
    | {
        _id: string;
        businessName?: string;
        slug?: string;
        businessLogo?: string;
        address?: { fullAddress?: string; city?: string; state?: string };
        contact?: { phone?: string; email?: string };
      }
    | string;
  items: {
    product: { _id: string; name?: string; media?: string[]; price?: number } | string | null;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }[];
  itemsTotal?: number;
  totalAmount: number;
  deliveryFee: number;
  deliveryMethod: DeliveryMethod;
  shippingAddress?: { fullAddress?: string; city?: string; state?: string; phone?: string };
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  paymentType?: PaymentType;
  fulfilment?: OrderFulfilment;
  trackingNumber?: string;
  disputeStatus?: DisputeStatus;
  paidAt?: string;
  createdAt: string;
  updatedAt?: string;
  // Timestamps of each step (models/order-model.ts); each is set only when it happened.
  riderBookedAt?: string;
  payoutReleasedAt?: string;
  autoReleaseAt?: string;
  disputedAt?: string;
  buyerReportedAt?: string;
  sellerRespondedAt?: string;
  cancelledAt?: string;
  rejectedAt?: string;
  rejectReason?: string;
}

export interface OrderDetailResponse {
  order: OrderDetail;
  role: 'buyer' | 'seller';
  actions: OrderActions;
  moneyNote: string | null;
}

export interface PaymentBreakdown {
  items: number;
  delivery: number;
  serviceFee: number;
  total: number;
}

/** POST /orders/:id/pay */
export interface StartPaymentResponse {
  paymentToken: string;
  reference: string;
  amountToPay: number;
  breakdown: PaymentBreakdown;
  /** The buyer's own Payluk customer id (for the widget's customerId). */
  customerId: string;
  paymentType: PaymentType;
}

/** GET /orders/:id/payment-status */
export interface PaymentStatus {
  paymentStatus: OrderPaymentStatus;
  status: OrderStatus;
  paymentType: PaymentType;
  payoutReleased: boolean;
  disputeStatus: DisputeStatus | null;
}

export interface DisputeEntry {
  from: 'buyer' | 'seller';
  name: string | null;
  message: string | null;
  proofUrl: string | null;
  at: string | null;
}

export interface DeliveryCost {
  cost: number;
  vat: number;
  totalCost: number;
  state: string;
}

/** GET /logs/notifications row, mapped (models/notification-model.ts). */
export interface Notification {
  _id: string;
  /** Backend category: SECURITY | SOCIAL | BUSINESS | SYSTEM | LIKE | COMMENT. */
  type: string;
  actor: { _id: string; name: string; avatar: string | null } | null;
  title: string;
  /** What to show: summary || message || title (same as the web pop-ups). */
  text: string;
  read: boolean;
  createdAt: string;
  modelType: 'Post' | 'Business' | 'Product' | 'User' | 'Comment' | 'Order' | null;
  /** The related document's id (the order, post, product...). */
  relatedId: string | null;
  /** For a Comment notice: the post it belongs to, when the server sends it. */
  postId: string | null;
  /** Who it was sent to: the user or their shop (decides which inbox a message notice opens). */
  recipientId: string | null;
}

export interface ConversationParticipant {
  _id: string;
  name: string;
  avatar: string | null;
  model: AuthorType;
}

export interface Conversation {
  _id: string;
  participant: ConversationParticipant;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface Message {
  _id: string;
  conversationId: string;
  content: string;
  senderId: string;
  senderModel: AuthorType;
  createdAt: string;
}

/** GET /logs/activities row, mapped. */
export interface ActivityLog {
  _id: string;
  action: string;
  detail: string;
  ip?: string;
  device?: string;
  location?: string;
  createdAt: string;
}

export interface BankOption {
  name: string;
  code: string;
}

/** GET /wallet — hasProfile false means no payment profile yet (an empty wallet). */
export interface WalletBalance {
  hasProfile: boolean;
  mainBalance: number;
  escrowBalance: number;
  currency: string;
}

/** One row of GET /wallet/activity. */
export interface WalletActivityRow {
  id: string;
  type: 'Payment received' | 'Payment sent' | 'Withdrawal' | 'Refund' | string;
  direction: 'credit' | 'debit';
  details: string;
  amount: number;
  fee: number;
  currency: string;
  status: 'Success' | 'Pending' | 'Failed' | 'Held' | 'Released' | string;
  date: string | null;
  orderId: string | null;
}

export interface WalletActivityPage {
  data: WalletActivityRow[];
  /** Passed through from Payluk; may be null. */
  pagination: { count: number; pages: number; isLastPage: boolean } | null;
}

/** One row of GET /wallet/held: an order whose money Buyer-Protected is holding. */
export interface HeldOrder {
  orderId: string;
  orderNumber: string;
  role: 'buyer' | 'seller';
  name: string;
  amount: number;
  paidAt: string | null;
  autoReleaseAt: string | null;
  problem: boolean;
}

export interface SearchResults {
  businesses: BusinessType[];
  products: UnifiedPost[];
}

/** Normalized AI-search result — one shape for products & businesses, all sources. */
export interface AISearchResult {
  id: string;
  type: 'business' | 'product';
  name: string;
  description: string;
  subtitle: string;
  image: string | null;
  price: number | null;
  rating: number | null;
  location: string | null;
  inStock: boolean | null;
  score: number;
  raw: Record<string, unknown>;
}

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface BookmarkBusiness {
  _id: string;
  businessName: string;
  businessLogo: string;
  category: string;
  averageRating: number;
  totalReviews: number;
  address: string;
  about: string;
}
