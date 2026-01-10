import mongoose from "mongoose";

const cashClosingSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    // Movimientos
    movements: {
      initialFund: {
        type: Number,
        default: 0
      },
      expense1: {
        type: Number,
        default: 0
      },
      expense2: {
        type: Number,
        default: 0
      }
    },
    // Arqueo
    arqueo: {
      cash: {
        type: Number,
        default: 0
      },
      card: {
        type: Number,
        default: 0
      },
      transfer: {
        type: Number,
        default: 0
      }
    },
    // Totales calculados
    totals: {
      pending: {
        type: Number,
        default: 0
      },
      totalSales: {
        type: Number,
        default: 0
      },
      totalVentasCalculado: {
        type: Number,
        default: 0
      },
      diferencia: {
        type: Number,
        default: 0
      }
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open"
    }
  },
  {
    timestamps: true
  }
);

// Índice compuesto para buscar por fecha y usuario
cashClosingSchema.index({ date: 1, user: 1 });
export default mongoose.model("CashClosing", cashClosingSchema);