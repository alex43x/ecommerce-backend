import CashClosing from "../models/CashClosing.js";

// Crear o actualizar cierre de caja
export const saveCashClosing = async (req, res, next) => {
  try {
    const { date, movements, arqueo, totals } = req.body;
    const userId = req.user.id; // Asumiendo que tienes middleware de autenticación

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "La fecha es requerida"
      });
    }

    // Buscar si ya existe un cierre para esta fecha y usuario
    const existingClosing = await CashClosing.findOne({
      date: new Date(date),
      user: userId
    });

    if (existingClosing) {
      // Actualizar el existente
      existingClosing.movements = movements;
      existingClosing.arqueo = arqueo;
      existingClosing.totals = totals;
      
      await existingClosing.save();

      return res.status(200).json({
        success: true,
        message: "Cierre de caja actualizado exitosamente",
        data: existingClosing
      });
    }

    // Crear nuevo cierre
    const newClosing = new CashClosing({
      date: new Date(date),
      user: userId,
      movements,
      arqueo,
      totals
    });

    await newClosing.save();

    res.status(201).json({
      success: true,
      message: "Cierre de caja guardado exitosamente",
      data: newClosing
    });
  } catch (error) {
    next(error);
  }
};

// Obtener cierre de caja por fecha
export const getCashClosingByDate = async (req, res, next) => {
  try {
    const { date } = req.query;
    const userId = req.user.id;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "La fecha es requerida"
      });
    }

    const closing = await CashClosing.findOne({
      date: new Date(date),
      user: userId
    }).populate("user", "name email");

    if (!closing) {
      return res.status(404).json({
        success: false,
        message: "No se encontró cierre de caja para esta fecha"
      });
    }

    res.status(200).json({
      success: true,
      data: closing
    });
  } catch (error) {
    next(error);
  }
};

// Obtener todos los cierres de caja (con paginación)
export const getAllCashClosings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    
    const query = {};
    
    // Filtrar por rango de fechas si se proporciona
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const closings = await CashClosing.find(query)
      .populate("user", "name email role")
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await CashClosing.countDocuments(query);

    res.status(200).json({
      success: true,
      data: closings,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    next(error);
  }
};

// Cerrar caja (cambiar status a closed)
export const closeCashClosing = async (req, res, next) => {
  try {
    const { id } = req.params;

    const closing = await CashClosing.findById(id);

    if (!closing) {
      return res.status(404).json({
        success: false,
        message: "Cierre de caja no encontrado"
      });
    }

    if (closing.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "Este cierre de caja ya está cerrado"
      });
    }

    closing.status = "closed";
    await closing.save();

    res.status(200).json({
      success: true,
      message: "Cierre de caja finalizado exitosamente",
      data: closing
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar cierre de caja
export const deleteCashClosing = async (req, res, next) => {
  try {
    const { id } = req.params;

    const closing = await CashClosing.findByIdAndDelete(id);

    if (!closing) {
      return res.status(404).json({
        success: false,
        message: "Cierre de caja no encontrado"
      });
    }

    res.status(200).json({
      success: true,
      message: "Cierre de caja eliminado exitosamente"
    });
  } catch (error) {
    next(error);
  }
};