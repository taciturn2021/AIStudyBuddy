const Notebook = require('../models/Notebook');

exports.createNotebook = async (req, res) => {
  try {
    const { title, description } = req.body;
    
    const notebook = new Notebook({
      user: req.user.id,
      title,
      description
    });
    
    await notebook.save();
    
    res.status(201).json({
      success: true,
      data: notebook
    });
  } catch (error) {
    console.error('Error creating notebook:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getNotebooks = async (req, res) => {
  try {
    const notebooks = await Notebook.find({ user: req.user.id })
      .sort({ lastUpdated: -1 });
    
    res.status(200).json({
      success: true,
      count: notebooks.length,
      data: notebooks
    });
  } catch (error) {
    console.error('Error fetching notebooks:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getNotebook = async (req, res) => {
  try {
    const notebook = await Notebook.findById(req.params.id);
    
    if (!notebook) {
      return res.status(404).json({
        success: false,
        message: 'Notebook not found'
      });
    }
    
    if (notebook.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this notebook'
      });
    }
    
    res.status(200).json({
      success: true,
      data: notebook
    });
  } catch (error) {
    console.error('Error fetching notebook:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Notebook not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.updateNotebook = async (req, res) => {
  try {
    const { title, description } = req.body;
    
    let notebook = await Notebook.findById(req.params.id);
    
    if (!notebook) {
      return res.status(404).json({
        success: false,
        message: 'Notebook not found'
      });
    }
    
    if (notebook.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this notebook'
      });
    }
    
    notebook.title = title || notebook.title;
    notebook.description = description !== undefined ? description : notebook.description;
    notebook.lastUpdated = Date.now();
    
    await notebook.save();
    
    res.status(200).json({
      success: true,
      data: notebook
    });
  } catch (error) {
    console.error('Error updating notebook:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Notebook not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.deleteNotebook = async (req, res) => {
  try {
    const notebook = await Notebook.findById(req.params.id);
    
    if (!notebook) {
      return res.status(404).json({
        success: false,
        message: 'Notebook not found'
      });
    }
    
    if (notebook.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this notebook'
      });
    }
    
    await notebook.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Notebook deleted'
    });
  } catch (error) {
    console.error('Error deleting notebook:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Notebook not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};