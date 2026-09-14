"use server";

import { z } from "zod";

const itemSchema = z.object({
  product_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  size: z.string().default(""),
  color: z.string().default(""),
  qty: z.number().int().min(1),
  unit_price: z.number().min(0),
});

const orderSchema = z.object({
  customer_name: z.string().min(2).max(120),
  phone: z.string().min(6).max(30),
  address: z.string().min(5).max(500),
  payment_method: z.string().min(2).max(40),
  delivery_fee: z.number().min(0),
  coupon_code: z.string().max(60).optional().nullable(),
  items: z.array(itemSchema).min(1),
});

type PlaceOrderInput = z.infer<typeof orderSchema>;

export async function placeOrder(input: { data: PlaceOrderInput } | PlaceOrderInput) {
  const data = "data" in input ? input.data : input;
  const parsed = orderSchema.parse(data);

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const subtotal = parsed.items.reduce((n, i) => n + i.qty * i.unit_price, 0);

  let discount = 0;
  const code = (parsed.coupon_code ?? "").trim().toLowerCase();
  if (code) {
    const { data: coupon } = await supabaseAdmin
      .from("coupons")
      .select("discount, discount_type, min_order, start_date, end_date, is_active")
      .eq("code", code)
      .maybeSingle();
    const now = Date.now();
    if (
      coupon &&
      coupon.is_active &&
      new Date(coupon.start_date).getTime() <= now &&
      new Date(coupon.end_date).getTime() >= now &&
      subtotal >= Number(coupon.min_order)
    ) {
      const raw =
        coupon.discount_type === "percentage"
          ? (subtotal * Number(coupon.discount)) / 100
          : Number(coupon.discount);
      discount = Math.min(Math.round(raw), subtotal);
    }
  }

  const total = subtotal - discount + parsed.delivery_fee;

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .insert({
      customer_name: parsed.customer_name,
      phone: parsed.phone,
      address: `${parsed.address}${discount > 0 ? ` — Coupon: ${code} (−${discount})` : ""}`,
      payment_method: parsed.payment_method,
      subtotal,
      delivery_fee: parsed.delivery_fee,
      total,
      status: "Processing",
    })
    .select("id, created_at")
    .single();
  if (error) throw new Error(error.message);

  const { error: itemsError } = await supabaseAdmin.from("order_items").insert(
    parsed.items.map((i) => ({
      order_id: order.id as string,
      product_id: i.product_id ?? null,
      name: i.name,
      size: i.size,
      color: i.color,
      qty: i.qty,
      unit_price: i.unit_price,
    })),
  );
  if (itemsError) throw new Error(itemsError.message);

  return {
    id: order.id as string,
    code: `FZ-${(order.id as string).slice(0, 6).toUpperCase()}`,
    total,
    created_at: order.created_at as string,
  };
}

export async function trackOrder(
  input: { data: { code: string; phone: string } } | { code: string; phone: string },
) {
  const data = "data" in input ? input.data : input;
  const parsed = z
    .object({ code: z.string().min(3).max(60), phone: z.string().min(4).max(30) })
    .parse(data);

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const code = parsed.code.replace(/^FZ-/i, "").trim().toLowerCase();

  const { data: rows, error } = await supabaseAdmin
    .from("orders")
    .select(
      "id, status, total, created_at, customer_name, order_items(name, qty, size, color, unit_price)",
    )
    .eq("phone", parsed.phone.trim())
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);

  const match = (rows ?? []).find((r) => String(r.id).toLowerCase().startsWith(code));
  if (!match) return { found: false as const };

  return {
    found: true as const,
    order: {
      code: `FZ-${String(match.id).slice(0, 6).toUpperCase()}`,
      status: match.status as string,
      total: Number(match.total),
      created_at: match.created_at as string,
      customer_name: match.customer_name as string,
      items: (match.order_items ?? []) as {
        name: string;
        qty: number;
        size: string;
        color: string;
        unit_price: number;
      }[],
    },
  };
}

export async function listOrdersByPhone(
  input: { data: { phone: string } } | { phone: string } | string,
) {
  const phone =
    typeof input === "string" ? input : "data" in input ? input.data.phone : input.phone;
  const parsed = z.string().min(4).max(30).parse(phone);

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: rows, error } = await supabaseAdmin
    .from("orders")
    .select("id, status, total, created_at, order_items(qty)")
    .eq("phone", parsed.trim())
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message);
  return (rows ?? []).map((r) => ({
    id: `FZ-${String(r.id).slice(0, 6).toUpperCase()}`,
    date: new Date(r.created_at as string).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    status: r.status as string,
    total: Number(r.total),
    items: (r.order_items ?? []).reduce((n: number, i: { qty: number }) => n + i.qty, 0),
  }));
}
