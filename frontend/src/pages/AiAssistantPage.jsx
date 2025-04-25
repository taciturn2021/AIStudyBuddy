import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getDocuments } from '../services/documentService'; 
import { sendChatMessage, getChats, getChatMessages, deleteChat, getAvailableModels, updateChatTitle } from '../services/chatService'; 
import LoadingIndicator from '../components/LoadingIndicator';
import './AiAssistantPage.css';

const NEW_CHAT_ID = 'new';
const MESSAGES_BEFORE_TITLE_UPDATE = 10;

function AiAssistantPage({ notebookId }) {
  const [documents, setDocuments] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState(new Set());
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(NEW_CHAT_ID);
  const [messages, setMessages] = useState([]);     
  const [currentInput, setCurrentInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [modelsError, setModelsError] = useState('');
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [error, setError] = useState('');
  const [sidebarError, setSidebarError] = useState('');
  const chatHistoryRef = useRef(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  useEffect(() => {
    const fetchModels = async () => {
      setIsLoadingModels(true);
      setModelsError('');
      try {
        const response = await getAvailableModels();
        const fetchedModels = response.data || [];
        setAvailableModels(fetchedModels);
        if (fetchedModels.length > 0) {
          setSelectedModel(fetchedModels[0].id);
        } else {
           setModelsError('No AI models available.');
        }
      } catch (err) {
        console.error('Error fetching available models:', err);
        setModelsError('Failed to load AI models.');
        setAvailableModels([]);
      } finally {
        setIsLoadingModels(false);
      }
    };
    fetchModels();
  }, []);

  useEffect(() => {
    if (notebookId) {
      setIsLoadingDocs(true);
      setIsLoadingChats(true);
      setError('');
      setSidebarError('');
      setMessages([]);
      setSelectedChatId(NEW_CHAT_ID);
      setSelectedDocIds(new Set());

      const fetchDocs = getDocuments(notebookId)
        .then(response => {
          setDocuments(response.data?.filter(doc => doc.processed) || []);
        })
        .catch(err => {
          console.error('Error fetching documents for chat:', err);
          setSidebarError(prev => prev + ' Failed to load documents.');
        })
        .finally(() => setIsLoadingDocs(false));

      const fetchChats = getChats(notebookId)
        .then(response => {
          setChats(response.data || []);
        })
        .catch(err => {
          console.error('Error fetching chats:', err);
          setSidebarError(prev => prev + ' Failed to load chat list.');
        })
        .finally(() => setIsLoadingChats(false));

      Promise.all([fetchDocs, fetchChats]).catch(err => {
         console.error("Error loading page data:", err);
      });
    }
  }, [notebookId]);

  useEffect(() => {
    if (selectedChatId && selectedChatId !== NEW_CHAT_ID) {
      setIsLoadingMessages(true);
      setError('');
      setMessages([]);
      getChatMessages(selectedChatId)
        .then(response => {
          setMessages(response.data?.messages || []);
        })
        .catch(err => {
          console.error(`Error fetching messages for chat ${selectedChatId}:`, err);
          setError(`Failed to load messages for this chat.`);
          setMessages([{ role: 'system', content: 'Error loading messages.' }]);
        })
        .finally(() => {
          setIsLoadingMessages(false);
        });
    } else {
      setMessages([]);
      setError('');
      setIsLoadingMessages(false);
    }
  }, [selectedChatId]);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  const handleDocSelectionChange = (docId) => {
    setSelectedDocIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    const prompt = currentInput.trim();
    if (!prompt || isLoadingChat || !notebookId) return;

    setError('');
    setIsLoadingChat(true);
    
    const userMessage = { role: 'user', content: prompt, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');

    let effectivePrompt = prompt;
    if (selectedChatId === NEW_CHAT_ID || messages.length === 0) {
      effectivePrompt = `${prompt}\n\n[System: Please use proper Markdown formatting in your responses for better readability. For headings, use # for main heading, ## for subheading, ### for sub-subheading. Use proper syntax for bullets, lists, code blocks, emphasis, and tables.]`;
    }

    const currentChatId = selectedChatId === NEW_CHAT_ID ? null : selectedChatId;

    try {
      const payload = {
        prompt: effectivePrompt,
        model: selectedModel,
        selectedDocumentIds: Array.from(selectedDocIds),
        chatId: currentChatId,
      };
      const response = await sendChatMessage(notebookId, payload);
      
      const modelMessage = { role: 'model', content: response.data.reply, timestamp: new Date().toISOString() };
      setMessages(prev => {
        const lastUserMsg = [...prev].reverse().find(m => m.role === 'user');
        return [...prev.filter(m => m !== lastUserMsg || m.content !== prompt), userMessage, modelMessage];
      });

      const returnedChatId = response.data.chatId;

      if (!currentChatId && returnedChatId) {
        setIsLoadingChats(true);
        getChats(notebookId)
          .then(chatListResponse => {
            setChats(chatListResponse.data || []);
            setSelectedChatId(returnedChatId);
            generateAndUpdateTitle(returnedChatId, [userMessage, modelMessage], true);
          })
          .catch(err => {
            console.error('Error refetching chats after new chat creation:', err);
            setSidebarError('Failed to update chat list.');
          })
          .finally(() => setIsLoadingChats(false));
      } else if (currentChatId && returnedChatId === currentChatId) {
        setChats(prevChats => prevChats.map(chat =>
          chat._id === currentChatId ? { ...chat, lastUpdatedAt: new Date().toISOString() } : chat
        ).sort((a, b) => new Date(b.lastUpdatedAt) - new Date(a.lastUpdatedAt)));
        const allMessages = [...messages, userMessage, modelMessage];
        if (
            allMessages.length >= MESSAGES_BEFORE_TITLE_UPDATE && 
            allMessages.length % MESSAGES_BEFORE_TITLE_UPDATE === 0) {
          generateAndUpdateTitle(currentChatId, allMessages, false);
        }
      }

    } catch (err) {
      console.error('Error sending chat message:', err);
      const errorMessage = err.response?.data?.message || 'Failed to get response from AI. Please check API key and try again.';
      setError(errorMessage);
      setMessages(prev => [...prev, { role: 'model', content: `Error: ${errorMessage}`, timestamp: new Date().toISOString() }]);
    } finally {
      setIsLoadingChat(false);
    }
  }, [currentInput, isLoadingChat, selectedModel, selectedDocIds, notebookId, selectedChatId, messages]);

  const generateAndUpdateTitle = async (chatId, chatMessages, isFirstMessage) => {
    if (!chatId) return;

    try {
      const titlePrompt = isFirstMessage
        ? `Based on this first message, please generate a concise title (max 4-5 words) that represents what this conversation is about: "${chatMessages[0].content}"`
        : `Please summarize our conversation so far in a concise title (max 4-5 words). Here's the conversation: ${chatMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`;

      const titlePayload = {
        prompt: titlePrompt,
        model: "gemini-2.0-flash",
        selectedDocumentIds: [],
        chatId: null,
        generateTitleOnly: true
      };

      const titleResponse = await sendChatMessage(notebookId, titlePayload);
      const newTitle = titleResponse.data.reply.replace(/^Title: |^"|"$/g, '').trim();
      
      if (newTitle) {
        await updateChatTitle(chatId, newTitle);
        
        setChats(prevChats => prevChats.map(chat => 
          chat._id === chatId ? { ...chat, title: newTitle } : chat
        ));
      }
    } catch (err) {
      console.error('Error generating or updating chat title:', err);
    }
  };

  const handleSelectChat = (chatId) => {
    if (chatId === selectedChatId) return;
    setSelectedChatId(chatId);
    setError('');
    setSidebarError('');
    setIsEditingTitle(false);
  };

  const handleNewChat = () => {
    handleSelectChat(NEW_CHAT_ID);
  };

  const handleDeleteChat = async (chatIdToDelete) => {
    if (!window.confirm('Are you sure you want to delete this chat?')) {
      return;
    }
    setSidebarError('');
    try {
      await deleteChat(chatIdToDelete);
      setChats(prev => prev.filter(chat => chat._id !== chatIdToDelete));
      if (selectedChatId === chatIdToDelete) {
        handleNewChat();
      }
    } catch (err) {
      console.error(`Error deleting chat ${chatIdToDelete}:`, err);
      setSidebarError('Failed to delete chat.');
    }
  };

  const handleStartTitleEdit = () => {
    if (selectedChatId === NEW_CHAT_ID) return;
    const currentChat = chats.find(chat => chat._id === selectedChatId);
    if (currentChat) {
      setTitleInput(currentChat.title || 'Untitled Chat');
      setIsEditingTitle(true);
    }
  };

  const handleSaveTitle = async () => {
    if (selectedChatId === NEW_CHAT_ID || !titleInput.trim()) {
      setIsEditingTitle(false);
      return;
    }

    try {
      const response = await updateChatTitle(selectedChatId, titleInput.trim());
      
      setChats(prevChats => prevChats.map(chat => 
        chat._id === selectedChatId ? { ...chat, title: response.data.title } : chat
      ));
      
      setIsEditingTitle(false);
    } catch (err) {
      console.error('Error updating chat title:', err);
    }
  };

  const handleCancelTitleEdit = () => {
    setIsEditingTitle(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const currentChatTitle = selectedChatId === NEW_CHAT_ID
    ? 'New Chat'
    : chats.find(chat => chat._id === selectedChatId)?.title || 'Chat';

  return (
    <div className="ai-assistant-page">
      <div className="ai-assistant-header">
        <Link to={`/notebook/${notebookId}`} className="btn-back">
            ← Back to Notebook
        </Link>
        
        {isEditingTitle && selectedChatId !== NEW_CHAT_ID ? (
          <div className="title-edit-container">
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="title-edit-input"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') handleCancelTitleEdit();
              }}
            />
            <button onClick={handleSaveTitle} className="title-save-btn">Save</button>
            <button onClick={handleCancelTitleEdit} className="title-cancel-btn">Cancel</button>
          </div>
        ) : (
          <h1 onClick={selectedChatId !== NEW_CHAT_ID ? handleStartTitleEdit : undefined} className={selectedChatId !== NEW_CHAT_ID ? "editable-title" : ""}>
            {selectedChatId === NEW_CHAT_ID ? "AI Study Assistant" : currentChatTitle}
            {selectedChatId !== NEW_CHAT_ID && <span className="edit-title-icon">✎</span>}
          </h1>
        )}
        
        {selectedChatId !== NEW_CHAT_ID && (
          <button
            className="btn-header-delete"
            onClick={() => handleDeleteChat(selectedChatId)}
            disabled={isLoadingChats || isLoadingMessages}
            title="Delete Current Chat"
          >
            ×
          </button>
        )}
      </div>
      <div className="ai-assistant-body">
        <div className="chat-sidebar">
          <div className="chat-section-header">
            <h4>Chats</h4>
          </div>
          <button onClick={handleNewChat} className="btn-new-chat" disabled={isLoadingChats || isLoadingMessages}>
            + New Chat
          </button>
          {isLoadingChats ? (
            <LoadingIndicator />
          ) : sidebarError && chats.length === 0 ? (
             <p className="text-danger">{sidebarError}</p>
          ) : (
            <ul className="chat-list">
              {chats.map(chat => (
                <li
                  key={chat._id}
                  className={`chat-list-item ${selectedChatId === chat._id ? 'selected' : ''}`}
                  onClick={() => handleSelectChat(chat._id)}
                >
                  <span className="chat-title">{chat.title || 'Untitled Chat'}</span>
                </li>
              ))}
            </ul>
          )}
          {sidebarError && <p className="text-danger">{sidebarError}</p>}
          <hr />
          <div className="chat-section-header">
            <h4>Context Documents</h4>
          </div>
          {isLoadingDocs ? (
            <LoadingIndicator />
          ) : documents.length === 0 && !sidebarError ? (
            <p>No processed documents available in this notebook.</p>
          ) : (
            <ul className="document-select-list">
              {documents.map(doc => (
                <li key={doc._id}>
                  <label>
                    <input 
                      type="checkbox"
                      checked={selectedDocIds.has(doc._id)}
                      onChange={() => handleDocSelectionChange(doc._id)}
                      disabled={isLoadingChat || isLoadingMessages}
                    />
                    {doc.originalFilename}
                  </label>
                </li>
              ))}
            </ul>
          )}
           {/* Display doc loading error here if not already shown by chat loading error */}
          {sidebarError && documents.length === 0 && <p className="text-danger">{sidebarError.includes('documents') ? sidebarError : 'Failed to load documents.'}</p>}
          <hr />
          <div className="model-selector form-group">
              <label htmlFor="modelSelect">Select Model:</label>
              {isLoadingModels ? (
                  <LoadingIndicator />
              ) : modelsError ? (
                  <p className="text-danger">{modelsError}</p>
              ) : availableModels.length === 0 ? (
                  <p>No models loaded.</p> // Fallback if no models and no error
              ) : (
                  <select 
                      id="modelSelect"
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      // Disable while models loading OR chat/messages loading
                      disabled={isLoadingModels || isLoadingChat || isLoadingMessages}
                      className="form-control"
                  >
                      {availableModels.map(model => (
                          <option key={model.id} value={model.id}>{model.name}</option>
                      ))}
                  </select>
              )}
          </div>
        </div>
        <div className="chat-main">
          <div className="chat-history" ref={chatHistoryRef}>
            {isLoadingMessages ? (
              <div className="loading-messages"><LoadingIndicator /></div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.role}`}>
                  <div className="message-bubble">
                    {msg.role === 'user' ? (
                      // Display user messages as plain text
                      <div className="message-content">{msg.content}</div>
                    ) : (
                      // Render model messages with Markdown
                      <div className="markdown-content">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            // Override components for styling
                            a: ({node, ...props}) => <a target="_blank" rel="noopener noreferrer" {...props} />,
                            pre: ({node, ...props}) => <pre className="code-block" {...props} />,
                            code: ({node, inline, ...props}) => 
                              inline ? <code className="inline-code" {...props} /> : <code {...props} />
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {/* Loading indicator specifically for sending/receiving */}
            {isLoadingChat && (
                <div className="chat-message model loading">
                    <div className="message-bubble">... thinking ...</div>
                </div>
            )}
             {/* Display general chat error if not loading messages */}
            {error && !isLoadingMessages && <div className="alert alert-danger chat-error">{error}</div>}
             {/* Prompt to start if no messages and not loading */}
             {messages.length === 0 && !isLoadingMessages && !error && (
                 <div className="chat-message system">
                    <div className="message-bubble">
                        {selectedChatId === NEW_CHAT_ID
                         ? "Select documents and ask a question to start a new chat."
                         : "No messages in this chat yet. Ask a question!"}
                    </div>
                 </div>
             )}
          </div>
          <form onSubmit={handleSendMessage} className="chat-input-form">
            <textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder={selectedDocIds.size > 0
                 ? `Ask about selected docs (${selectedChatId === NEW_CHAT_ID ? 'new chat' : 'this chat'})...`
                 : `Ask a general question (${selectedChatId === NEW_CHAT_ID ? 'new chat' : 'this chat'})...`}
              rows={3}
              disabled={isLoadingChat || isLoadingMessages} // Disable input while loading messages or sending
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  handleSendMessage(e);
                }
              }}
            />
            <button type="submit" disabled={isLoadingChat || isLoadingMessages || !currentInput.trim()}>
              {isLoadingChat ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
      {/* Styles moved to AiAssistantPage.css */}
    </div>
  );
}

export default AiAssistantPage; 