import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

// Updated interface to include timestamp for each sale entry
export interface SaleEntry {
  amount: number;
  timestamp: string;
}

interface DailySalesData {
  chats: number;
  sales: SaleEntry[];
}

const DAILY_SALES_STORAGE_KEY = 'dailySalesTracker';

function loadDailySalesData(): DailySalesData {
  const saved = localStorage.getItem(DAILY_SALES_STORAGE_KEY);
  if (saved === null) {
    return { chats: 0, sales: [] };
  }

  try {
    const parsed = JSON.parse(saved);
    if (typeof parsed === 'object' && parsed !== null && Array.isArray(parsed.sales)) {
      return {
        chats: typeof parsed.chats === 'number' ? parsed.chats : 0,
        sales: parsed.sales
      };
    }
  } catch {
    // If legacy format (number array), handle graceful fallback
  }

  return { chats: 0, sales: [] };
}

function saveDailySalesData(data: DailySalesData): void {
  localStorage.setItem(DAILY_SALES_STORAGE_KEY, JSON.stringify(data));
}

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-sales-tracker',
  templateUrl: './sales-tracker.component.html',
  styleUrl: './sales-tracker.component.css',
})
export class SalesTrackerComponent {
  private readonly savedData = loadDailySalesData();
  
  protected readonly chats = signal(this.savedData.chats);
  protected readonly sales = signal<SaleEntry[]>(this.savedData.sales);
  protected readonly amountSold = signal(0);

  // Computed metrics based on the sales array
  protected readonly salesMade = computed(() => this.sales().length);
  
  protected readonly totalRevenue = computed(() =>
    this.sales().reduce((total, sale) => total + sale.amount, 0)
  );

  protected readonly revenuePerChat = computed(() =>
    this.chats() > 0 ? this.totalRevenue() / this.chats() : 0
  );

  protected readonly conversionRate = computed(() =>
    this.chats() > 0 ? (this.salesMade() / this.chats()) * 100 : 0
  );

  protected readonly avgOrderValue = computed(() =>
    this.salesMade() > 0 ? this.totalRevenue() / this.salesMade() : 0
  );

  protected readonly lastOrderAmount = computed(() => {
    const currentSales = this.sales();
    return currentSales.length > 0 ? currentSales[currentSales.length - 1].amount : null;
  });

  getDate(): string {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  protected updateChats(event: Event): void {
    const input = event.target as HTMLInputElement;
    const chats = Math.max(0, Math.floor(Number(input.value) || 0));
    saveDailySalesData({ chats, sales: this.sales() });
    this.chats.set(chats);
  }

  protected updateSaleAmount(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.amountSold.set(Number(input.value) || 0);
  }

  protected addSale(): void {
    const amount = this.amountSold();

    if (amount === 0 || isNaN(amount)) {
      return;
    }

    // Capture current formatted time (e.g. "2:15 PM")
    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    const newSale: SaleEntry = {
      amount,
      timestamp: formattedTime
    };

    const updatedSales = [...this.sales(), newSale];
    saveDailySalesData({ chats: this.chats(), sales: updatedSales });
    this.sales.set(updatedSales);
    this.amountSold.set(0);
  }

  protected resetDashboard(): void {
    if (!window.confirm('Reset today’s chats and recorded sales?')) {
      return;
    }

    localStorage.removeItem(DAILY_SALES_STORAGE_KEY);
    this.chats.set(0);
    this.sales.set([]);
    this.amountSold.set(0);
  }
}