/**
 * Application-level TypeScript types.
 * These mirror the Supabase schema but are kept lightweight so the UI can stay
 * fully typed without a massive generated `Database` type.
 */

export type UUID = string;

export type Organization = {
  id: UUID;
  name: string;
  plan: "free" | "starter" | "pro" | "enterprise";
  created_at: string;
  updated_at: string;
};

export type Role = "owner" | "admin" | "support";

export type Profile = {
  id: UUID;
  org_id: UUID;
  email?: string | null;
  full_name?: string | null;
  role: Role;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
};

export type MetaConnection = {
  id: UUID;
  org_id: UUID;
  page_id: string;
  page_name?: string | null;
  page_category?: string | null;
  connected: boolean;
  webhook_verified: boolean;
  synced_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type ConversationStatus = "open" | "pending" | "resolved" | "archived" | "spam";

export type Customer = {
  id: UUID;
  org_id: UUID;
  psid: string;
  page_id?: string | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  profile_pic_url?: string | null;
  locale?: string | null;
  gender?: string | null;
  timezone?: number | null;
  tags?: string[];
  notes?: string | null;
  last_seen_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type Conversation = {
  id: UUID;
  org_id: UUID;
  customer_id?: UUID | null;
  page_id?: string | null;
  status: ConversationStatus;
  ai_mode: boolean;
  unread_count: number;
  last_message_at?: string | null;
  last_message_preview?: string | null;
  last_message_sender?: string | null;
  ai_handled: boolean;
  human_handled: boolean;
  is_important: boolean;
  order_id?: UUID | null;
  assigned_agent_id?: UUID | null;
  created_at: string;
  updated_at: string;
};

export type SenderRole = "customer" | "ai" | "human" | "system";
export type MessageType = "text" | "image" | "file" | "video" | "audio" | "template_button" | "system_event" | "order_status";
export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export type Message = {
  id: UUID;
  conversation_id: UUID;
  org_id: UUID;
  sender_role: SenderRole;
  message_type: MessageType;
  content?: string | null;
  text_content?: string | null;
  mime_type?: string | null;
  url?: string | null;
  metadata: Record<string, unknown>;
  mid?: string | null;
  sent_by_me: boolean;
  status: MessageStatus;
  ai_confidence?: number | null;
  created_at: string;
};

export type Product = {
  id: UUID;
  org_id: UUID;
  name: string;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  stock?: number | null;
  sku?: string | null;
  barcode?: string | null;
  category?: string | null;
  image_url?: string | null;
  is_enabled: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type Order = {
  id: UUID;
  org_id: UUID;
  order_number: string;
  customer_id?: UUID | null;
  conversation_id?: UUID | null;
  status: OrderStatus;
  total_amount: number;
  currency?: string | null;
  payment_status: PaymentStatus;
  payment_method?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: UUID;
  order_id: UUID;
  product_id?: UUID | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

export type KbDocStatus = "uploading" | "processing" | "ready" | "failed" | "disabled";

export type KbDocument = {
  id: UUID;
  org_id: UUID;
  title: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  status: KbDocStatus;
  enabled: boolean;
  category?: string | null;
  product_id?: UUID | null;
  chunk_count: number;
  token_count: number;
  error?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type KbChunk = {
  id: UUID;
  document_id: UUID;
  org_id: UUID;
  chunk_index: number;
  content: string;
  heading?: string | null;
  metadata: Record<string, unknown>;
  token_count?: number | null;
  created_at: string;
};

export type Setting = {
  org_id: UUID;
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
};

export type NotificationType =
  | "new_conversation"
  | "new_message"
  | "human_requested"
  | "new_order"
  | "order_confirmation"
  | "kb_processed"
  | "meta_disconnected"
  | "ai_error";

export type Notification = {
  id: UUID;
  org_id: UUID;
  user_id?: UUID | null;
  type: NotificationType;
  title: string;
  message?: string | null;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
};

export type ConversationWithCustomer = Conversation & {
  customer?: Customer | null;
  order?: Order | null;
};
