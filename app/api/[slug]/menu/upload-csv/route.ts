import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { restaurants, categories, menuItems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

interface CSVRow {
  category: string;
  name: string;
  price: string;
  food_type: string;
  description?: string;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    // Find restaurant
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.slug, slug))
      .limit(1);

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Read CSV content
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file is empty or invalid' }, { status: 400 });
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['category', 'name', 'price', 'food_type'];
    
    for (const required of requiredHeaders) {
      if (!headers.includes(required)) {
        return NextResponse.json(
          { error: `Missing required column: ${required}` },
          { status: 400 }
        );
      }
    }

    // Parse rows
    const rows: CSVRow[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        if (!row.category || !row.name || !row.price || !row.food_type) {
          errors.push(`Line ${i + 1}: Missing required fields`);
          continue;
        }

        rows.push(row as CSVRow);
      } catch (error) {
        errors.push(`Line ${i + 1}: Parse error`);
      }
    }

    // Get or create categories
    const categoryMap = new Map<string, string>(); // category name -> id
    const uniqueCategories = [...new Set(rows.map(r => r.category))];
    let categoriesCreated = 0;

    for (const categoryName of uniqueCategories) {
      // Check if exists
      const [existing] = await db
        .select()
        .from(categories)
        .where(
          and(
            eq(categories.restaurantId, restaurant.id),
            eq(categories.name, categoryName)
          )
        )
        .limit(1);

      if (existing) {
        categoryMap.set(categoryName, existing.id);
      } else {
        // Create new category
        const [newCategory] = await db
          .insert(categories)
          .values({
            id: randomUUID(),
            restaurantId: restaurant.id,
            name: categoryName,
            displayOrder: categoriesCreated,
            isActive: true,
            createdAt: new Date(),
          })
          .returning();
        
        categoryMap.set(categoryName, newCategory.id);
        categoriesCreated++;
      }
    }

    // Insert menu items
    let itemsCreated = 0;

    for (const row of rows) {
      try {
        const categoryId = categoryMap.get(row.category);
        if (!categoryId) {
          errors.push(`Item "${row.name}": Category not found`);
          continue;
        }

        const price = parseFloat(row.price);
        if (isNaN(price)) {
          errors.push(`Item "${row.name}": Invalid price`);
          continue;
        }

        // Validate and normalize food_type
        const foodType = row.food_type.toLowerCase().trim();
        if (!['veg', 'egg', 'non-veg'].includes(foodType)) {
          errors.push(`Item "${row.name}": Invalid food_type "${row.food_type}". Must be veg, egg, or non-veg`);
          continue;
        }

        await db.insert(menuItems).values({
          id: randomUUID(),
          restaurantId: restaurant.id,
          categoryId,
          name: row.name,
          description: row.description || null,
          price: price.toString(),
          foodType,
          isAvailable: true,
          displayOrder: 0,
          createdAt: new Date(),
        });

        itemsCreated++;
      } catch (error) {
        errors.push(`Item "${row.name}": ${error instanceof Error ? error.message : 'Insert failed'}`);
      }
    }

    return NextResponse.json({
      success: itemsCreated,
      errors,
      created: {
        categories: categoriesCreated,
        items: itemsCreated,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    console.error('CSV upload error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Helper to parse CSV line properly (handles quotes)
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}
