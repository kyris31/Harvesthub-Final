'use server'

import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export interface DashboardMetrics {
  activePlantings: number
  upcomingHarvests: number
  lowStockItems: number
  monthlyRevenue: number
  pendingSales: number
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const userId = session.user.id

  // Execute optimized query to get all metrics at once
  const result = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM planting_logs 
       WHERE user_id = ${userId} AND status = 'active' AND deleted_at IS NULL)::int 
       as active_plantings,
      
      (SELECT COUNT(*) FROM planting_logs 
       WHERE user_id = ${userId} 
       AND expected_harvest_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
       AND status = 'active' AND deleted_at IS NULL)::int 
       as upcoming_harvests,
      
      (SELECT COUNT(*) FROM input_inventory 
       WHERE user_id = ${userId} 
       AND current_quantity <= minimum_stock_level 
       AND deleted_at IS NULL)::int 
       as low_stock_items,
      
      (SELECT COALESCE(SUM(total_amount), 0) FROM sales 
       WHERE user_id = ${userId} 
       AND sale_date >= DATE_TRUNC('month', CURRENT_DATE)
       AND deleted_at IS NULL)::numeric 
       as monthly_revenue,
      
      (SELECT COUNT(*) FROM sales 
       WHERE user_id = ${userId} 
       AND payment_status = 'pending' 
       AND deleted_at IS NULL)::int 
       as pending_sales
  `)

  // SQL returns snake_case column names
  const row = result.rows[0] as {
    active_plantings: number
    upcoming_harvests: number
    low_stock_items: number
    monthly_revenue: number
    pending_sales: number
  }

  return {
    activePlantings: row.active_plantings || 0,
    upcomingHarvests: row.upcoming_harvests || 0,
    lowStockItems: row.low_stock_items || 0,
    monthlyRevenue: Number(row.monthly_revenue) || 0,
    pendingSales: row.pending_sales || 0,
  }
}

export interface RecentActivity {
  id: string
  type: 'planting' | 'harvest' | 'sale'
  description: string
  date: Date
  amount?: number
}

export async function getRecentActivity(): Promise<RecentActivity[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const userId = session.user.id

  // Get recent activities from multiple tables
  const result = await db.execute(sql`
    SELECT * FROM (
      SELECT 
        pl.id::text,
        'planting' as type,
        'Planted ' || c.name || ' (' || pl.quantity_planted::text || ' ' || pl.quantity_unit || ')' as description,
        pl.planting_date as date,
        NULL::numeric as amount
      FROM planting_logs pl
      JOIN crops c ON c.id = pl.crop_id
      WHERE pl.user_id = ${userId} AND pl.deleted_at IS NULL
      
      UNION ALL
      
      SELECT 
        hl.id::text,
        'harvest' as type,
        'Harvested ' || c.name || ' (' || hl.quantity_harvested::text || ' ' || hl.quantity_unit || ')' as description,
        hl.harvest_date as date,
        NULL::numeric as amount
      FROM harvest_logs hl
      JOIN planting_logs pl ON pl.id = hl.planting_log_id
      JOIN crops c ON c.id = pl.crop_id
      WHERE hl.user_id = ${userId} AND hl.deleted_at IS NULL
      
      UNION ALL
      
      SELECT 
        s.id::text,
        'sale' as type,
        'Sale to ' || COALESCE(cu.name, 'Walk-in') as description,
        s.sale_date as date,
        s.total_amount as amount
      FROM sales s
      LEFT JOIN customers cu ON cu.id = s.customer_id
      WHERE s.user_id = ${userId} AND s.deleted_at IS NULL
    ) AS activities
    ORDER BY date DESC
    LIMIT 10
  `)

  return result.rows.map((row: any) => ({
    id: row.id,
    type: row.type,
    description: row.description,
    date: new Date(row.date),
    amount: row.amount ? Number(row.amount) : undefined,
  }))
}
