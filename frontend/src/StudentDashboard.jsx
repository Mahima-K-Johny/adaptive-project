import React, { useEffect, useState, useRef } from 'react';
import { 
  BookOpen, 
  LogOut, 
  GraduationCap, 
  Bell, 
  FileText, 
  X,
  Download,
  MessageCircle,
  Send,
  Bot,
  User as UserIcon,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './StudentDashboard.css';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const email = localStorage.getItem('studentEmail');
  const studentName = email ? email.split('@')[0] : 'Student';
  
  const [courses, setCourses] = useState([]);
  const [notes, setNotes] = useState([]);
  const [showNotes, setShowNotes] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Chatbot states - FIXED: Added conversation context tracking
  const [waitingForLevel, setWaitingForLevel] = useState(false);
  const [pendingSubject, setPendingSubject] = useState(null);

  const [showChatbot, setShowChatbot] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: `Hi! I'm here to help you find courses and learn new things. What do you need?`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchCourses();
    fetchAllNotes();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/courses/all');
      setCourses(res.data);
    } catch (err) {
      console.error('❌ Error fetching courses:', err);
    }
  };

  const fetchAllNotes = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/materials/all');
      setNotes(res.data || []);
      setLoading(false);
    } catch (err) {
      console.error('❌ Failed to fetch notes:', err);
      setNotes([]);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('studentLoggedIn');
    localStorage.removeItem('studentEmail');
    alert('Logged out successfully!');
    navigate('/student-login');
  };

  // Enhanced AI Response Generator with Level Detection and Multiple Platforms
  const generateAIResponse = async (userMessage, isWaitingForLevel = waitingForLevel, currentPendingSubject = pendingSubject) => {
    const lowerMessage = userMessage.toLowerCase().trim();
    
    // Course recommendations with levels and multiple platforms - MOVED TO TOP
    const courseRecommendations = {
      'python': {
        'beginner': [
          {
            title: 'Python Tutorial for Beginners',
            platform: 'YouTube',
            instructor: 'Programming with Mosh',
            rating: '4.9',
            students: '15M+',
            link: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
            price: 'Free',
            duration: '6 hours'
          },
          {
            title: 'Python for Everybody',
            platform: 'Coursera',
            instructor: 'University of Michigan',
            rating: '4.8',
            students: '2M+',
            link: 'https://www.coursera.org/specializations/python',
            price: 'Free',
            duration: '8 months'
          },
          {
            title: 'Introduction to Python',
            platform: 'NPTEL',
            instructor: 'IIT Madras',
            rating: '4.7',
            students: '100K+',
            link: 'https://onlinecourses.nptel.ac.in/noc24_cs98/preview',
            price: 'Free',
            duration: '12 weeks'
          }
        ],
        'intermediate': [
          {
            title: '100 Days of Code: Python',
            platform: 'Udemy',
            instructor: 'Dr. Angela Yu',
            rating: '4.7',
            students: '800K+',
            link: 'https://www.udemy.com/course/100-days-of-code/',
            price: '₹499',
            duration: '60 hours'
          },
          {
            title: 'Python Programming',
            platform: 'Swayam',
            instructor: 'IIT Kharagpur',
            rating: '4.6',
            students: '50K+',
            link: 'https://onlinecourses.swayam2.ac.in/cec24_cs13/preview',
            price: 'Free',
            duration: '12 weeks'
          },
          {
            title: 'Intermediate Python',
            platform: 'YouTube',
            instructor: 'Tech With Tim',
            rating: '4.8',
            students: '500K+',
            link: 'https://www.youtube.com/watch?v=HGOBQPFzWKo',
            price: 'Free',
            duration: '6 hours'
          }
        ],
        'advanced': [
          {
            title: 'Advanced Python',
            platform: 'LinkedIn Learning',
            instructor: 'Joe Marini',
            rating: '4.7',
            students: '200K+',
            link: 'https://www.linkedin.com/learning/advanced-python',
            price: 'Premium',
            duration: '2 hours'
          },
          {
            title: 'Python Beyond the Basics',
            platform: 'Pluralsight',
            instructor: 'Reindert-Jan Ekker',
            rating: '4.6',
            students: '100K+',
            link: 'https://www.pluralsight.com/courses/python-beyond-basics',
            price: '$29/month',
            duration: '7 hours'
          }
        ]
      },
      'react': {
        'beginner': [
          {
            title: 'React Tutorial for Beginners',
            platform: 'YouTube',
            instructor: 'Programming with Mosh',
            rating: '4.9',
            students: '2M+',
            link: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
            price: 'Free',
            duration: '2.5 hours'
          },
          {
            title: 'Meta React Basics',
            platform: 'Coursera',
            instructor: 'Meta Staff',
            rating: '4.8',
            students: '200K+',
            link: 'https://www.coursera.org/learn/react-basics',
            price: 'Free',
            duration: '26 hours'
          },
          {
            title: 'React JS Full Course',
            platform: 'freeCodeCamp',
            instructor: 'freeCodeCamp',
            rating: '4.9',
            students: '1M+',
            link: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
            price: 'Free',
            duration: '11 hours'
          }
        ],
        'intermediate': [
          {
            title: 'React - The Complete Guide',
            platform: 'Udemy',
            instructor: 'Maximilian Schwarzmüller',
            rating: '4.6',
            students: '500K+',
            link: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/',
            price: '₹499',
            duration: '48 hours'
          },
          {
            title: 'Modern React with Redux',
            platform: 'Udemy',
            instructor: 'Stephen Grider',
            rating: '4.6',
            students: '300K+',
            link: 'https://www.udemy.com/course/react-redux/',
            price: '₹499',
            duration: '52 hours'
          }
        ],
        'advanced': [
          {
            title: 'Advanced React Patterns',
            platform: 'Frontend Masters',
            instructor: 'Kent C. Dodds',
            rating: '4.8',
            students: '50K+',
            link: 'https://frontendmasters.com/courses/advanced-react-patterns/',
            price: '$39/month',
            duration: '8 hours'
          }
        ]
      },
      'javascript': {
        'beginner': [
          {
            title: 'JavaScript Tutorial',
            platform: 'YouTube',
            instructor: 'Programming with Mosh',
            rating: '4.9',
            students: '5M+',
            link: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
            price: 'Free',
            duration: '1 hour'
          },
          {
            title: 'JavaScript Basics',
            platform: 'freeCodeCamp',
            instructor: 'freeCodeCamp',
            rating: '4.9',
            students: '1M+',
            link: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
            price: 'Free',
            duration: '300 hours'
          },
          {
            title: 'Intro to JavaScript',
            platform: 'Swayam',
            instructor: 'IIT Madras',
            rating: '4.5',
            students: '30K+',
            link: 'https://onlinecourses.swayam2.ac.in/cec21_cs01/preview',
            price: 'Free',
            duration: '8 weeks'
          }
        ],
        'intermediate': [
          {
            title: 'Complete JavaScript Course',
            platform: 'Udemy',
            instructor: 'Jonas Schmedtmann',
            rating: '4.7',
            students: '700K+',
            link: 'https://www.udemy.com/course/the-complete-javascript-course/',
            price: '₹499',
            duration: '69 hours'
          }
        ],
        'advanced': [
          {
            title: 'Advanced JavaScript',
            platform: 'Udemy',
            instructor: 'Andrei Neagoie',
            rating: '4.7',
            students: '100K+',
            link: 'https://www.udemy.com/course/advanced-javascript-concepts/',
            price: '₹499',
            duration: '25 hours'
          }
        ]
      },
      'dsa': {
        'beginner': [
          {
            title: 'DSA for Beginners',
            platform: 'YouTube',
            instructor: 'Abdul Bari',
            rating: '4.9',
            students: '2M+',
            link: 'https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkf03iYFl-O29szjTrs_O',
            price: 'Free',
            duration: '50 hours'
          },
          {
            title: 'Data Structures',
            platform: 'NPTEL',
            instructor: 'IIT Delhi',
            rating: '4.8',
            students: '200K+',
            link: 'https://onlinecourses.nptel.ac.in/noc24_cs50/preview',
            price: 'Free',
            duration: '12 weeks'
          },
          {
            title: 'Algorithms Course',
            platform: 'freeCodeCamp',
            instructor: 'freeCodeCamp',
            rating: '4.8',
            students: '800K+',
            link: 'https://www.youtube.com/watch?v=8hly31xKli0',
            price: 'Free',
            duration: '5 hours'
          }
        ],
        'intermediate': [
          {
            title: 'Mastering DSA',
            platform: 'Udemy',
            instructor: 'Abdul Bari',
            rating: '4.7',
            students: '400K+',
            link: 'https://www.udemy.com/course/datastructurescncpp/',
            price: '₹499',
            duration: '58 hours'
          },
          {
            title: 'DSA Specialization',
            platform: 'Coursera',
            instructor: 'UC San Diego',
            rating: '4.6',
            students: '150K+',
            link: 'https://www.coursera.org/specializations/data-structures-algorithms',
            price: 'Free',
            duration: '6 months'
          }
        ],
        'advanced': [
          {
            title: 'Advanced Algorithms',
            platform: 'MIT OpenCourseWare',
            instructor: 'MIT',
            rating: '4.9',
            students: '100K+',
            link: 'https://ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2015/',
            price: 'Free',
            duration: 'Self-paced'
          }
        ]
      },
      'web development': {
        'beginner': [
          {
            title: 'Web Dev for Beginners',
            platform: 'YouTube',
            instructor: 'freeCodeCamp',
            rating: '4.9',
            students: '3M+',
            link: 'https://www.youtube.com/watch?v=nu_pCVPKzTk',
            price: 'Free',
            duration: '12 hours'
          },
          {
            title: 'HTML, CSS, JavaScript',
            platform: 'Coursera',
            instructor: 'Johns Hopkins',
            rating: '4.7',
            students: '300K+',
            link: 'https://www.coursera.org/learn/html-css-javascript-for-web-developers',
            price: 'Free',
            duration: '40 hours'
          },
          {
            title: 'Web Development',
            platform: 'Swayam',
            instructor: 'IIT Roorkee',
            rating: '4.6',
            students: '80K+',
            link: 'https://onlinecourses.swayam2.ac.in/aic20_sp27/preview',
            price: 'Free',
            duration: '8 weeks'
          }
        ],
        'intermediate': [
          {
            title: 'Complete Web Developer',
            platform: 'Udemy',
            instructor: 'Rob Percival',
            rating: '4.5',
            students: '500K+',
            link: 'https://www.udemy.com/course/the-complete-web-developer-course-2/',
            price: '₹499',
            duration: '30 hours'
          }
        ],
        'advanced': [
          {
            title: 'Full Stack Specialization',
            platform: 'Coursera',
            instructor: 'Hong Kong University',
            rating: '4.7',
            students: '300K+',
            link: 'https://www.coursera.org/specializations/full-stack-react',
            price: 'Free',
            duration: '6 months'
          }
        ]
      }
    };
    
    // FIXED: Check if we're waiting for a level response using parameters
    if (isWaitingForLevel && currentPendingSubject) {
      const levelKeywords = {
        'beginner': ['beginner', 'basic', 'start', 'starting', 'entry', 'entry level', 'new', 'basics', 'fundamental', 'zero', 'scratch', 'begin', 'begginer'],
        'intermediate': ['intermediate', 'medium', 'middle', 'some experience', 'know basics', 'inter', 'mid'],
        'advanced': ['advanced', 'expert', 'professional', 'pro', 'master', 'deep', 'in depth', 'adv']
      };
      
      let detectedLevel = null;
      for (const [level, keywords] of Object.entries(levelKeywords)) {
        if (keywords.some(keyword => lowerMessage.includes(keyword))) {
          detectedLevel = level;
          break;
        }
      }
      
      if (detectedLevel && courseRecommendations[currentPendingSubject]?.[detectedLevel]) {
        const courses = courseRecommendations[currentPendingSubject][detectedLevel];
        // Reset state
        setWaitingForLevel(false);
        setPendingSubject(null);
        
        return {
          type: 'course_recommendation',
          message: `Great! Here are ${detectedLevel} level ${currentPendingSubject} courses:`,
          courses: courses
        };
      } else {
        // They didn't give a valid level
        return {
          type: 'text',
          message: `I didn't catch that. Are you a beginner, intermediate, or advanced learner?`
        };
      }
    }
    
    // Detect skill improvement requests
    const skillKeywords = ['improve', 'learn', 'skill', 'course', 'tutorial', 'study', 'practice', 'master', 'better at', 'suggest', 'recommend', 'teach', 'help me with', 'want to', 'need', 'how to'];
    const wantsToLearn = skillKeywords.some(keyword => lowerMessage.includes(keyword));
    
    // Detect level
    const levelKeywords = {
      'beginner': ['beginner', 'basic', 'start', 'starting', 'entry', 'entry level', 'new', 'basics', 'fundamental', 'zero', 'scratch', 'begin'],
      'intermediate': ['intermediate', 'medium', 'middle', 'some experience', 'know basics', 'inter', 'mid'],
      'advanced': ['advanced', 'expert', 'professional', 'pro', 'master', 'deep', 'in depth', 'adv']
    };
    
    let detectedLevel = null;
    for (const [level, keywords] of Object.entries(levelKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        detectedLevel = level;
        break;
      }
    }
    
    // Extract subject/topic
    const subjects = {
      'react': ['react', 'reactjs', 'react.js'],
      'javascript': ['javascript', 'js', 'es6'],
      'python': ['python', 'py'],
      'java': ['java'],
      'web development': ['web dev', 'web development', 'frontend', 'backend', 'fullstack', 'full stack'],
      'machine learning': ['ml', 'machine learning', 'ai', 'artificial intelligence'],
      'data science': ['data science', 'data analytics', 'analytics'],
      'dsa': ['dsa', 'data structures', 'algorithms', 'ds algo'],
      'c++': ['c++', 'cpp'],
      'nodejs': ['node', 'nodejs', 'node.js'],
      'database': ['database', 'sql', 'mongodb'],
    };
    
    let detectedSubject = null;
    for (const [subject, keywords] of Object.entries(subjects)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        detectedSubject = subject;
        break;
      }
    }
    
    // Simple greetings
    if (lowerMessage.match(/^(hi|hello|hey|hii|helo|hola)$/i)) {
      return { type: 'text', message: `Hi! How can I help you?` };
    }
    
    if (lowerMessage.includes('good morning')) {
      return { type: 'text', message: `Good morning! How can I help you today?` };
    }
    
    if (lowerMessage.includes('good evening') || lowerMessage.includes('good afternoon')) {
      return { type: 'text', message: `Good evening! What can I do for you?` };
    }
    
    if (lowerMessage.includes('how are you') || lowerMessage.includes('how r u')) {
      return { type: 'text', message: `I'm good! What about you? Need help with anything?` };
    }
    
    if (lowerMessage.match(/^(whats up|what's up|wassup)$/i)) {
      return { type: 'text', message: `Not much! Just here to help. What do you need?` };
    }
    
    if (lowerMessage.includes('who are you') || lowerMessage.includes('your name')) {
      return { type: 'text', message: `I'm an AI assistant here to help you find courses. What would you like to learn?` };
    }
    
    if (lowerMessage.includes('can you help') || lowerMessage.includes('help me')) {
      return { type: 'text', message: `Of course! What do you need help with?` };
    }
    
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return { type: 'text', message: `You're welcome! 😊` };
    }
    
    if (lowerMessage.match(/^(bye|goodbye|see you|gtg)$/i)) {
      return { type: 'text', message: `Bye! Take care! 👋` };
    }
    
    if (lowerMessage.match(/^(ok|okay|alright|cool|nice)$/i)) {
      return { type: 'text', message: `Great! Need anything else?` };
    }
    
    if (lowerMessage.match(/^(yes|yeah|yep)$/i)) {
      return { type: 'text', message: `Awesome! What can I help you with?` };
    }
    
    if (lowerMessage.match(/^(no|nope|nah)$/i)) {
      return { type: 'text', message: `Alright! Let me know if you need anything.` };
    }
    
    // Course recommendations with level
    if (wantsToLearn && detectedSubject && detectedLevel && courseRecommendations[detectedSubject]?.[detectedLevel]) {
      const courses = courseRecommendations[detectedSubject][detectedLevel];
      return {
        type: 'course_recommendation',
        message: `Great! Here are ${detectedLevel} level ${detectedSubject} courses:`,
        courses: courses
      };
    }
    
    // FIXED: Ask for level if not mentioned and set state
    if (wantsToLearn && detectedSubject && !detectedLevel) {
      // Set state to wait for level
      setWaitingForLevel(true);
      setPendingSubject(detectedSubject);
      
      return {
        type: 'text',
        message: `Cool! What level are you at?

• Beginner (Just starting)
• Intermediate (Some experience)
• Advanced (Want deep knowledge)

Just tell me your level!`
      };
    }
    
    // Ask for subject if not mentioned
    if (wantsToLearn && !detectedSubject) {
      return {
        type: 'text',
        message: `What do you want to learn? Like Python, React, Web Development, DSA...?`
      };
    }
    
    // Default
    return {
      type: 'text',
      message: `I'm not sure I understand. What are you looking for?`
    };
  };

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage,
      timestamp: new Date()
    }]);
    setIsTyping(true);

    try {
      // FIXED: Capture current state before async operation
      const currentWaitingForLevel = waitingForLevel;
      const currentPendingSubject = pendingSubject;
      
      const response = await generateAIResponse(userMessage, currentWaitingForLevel, currentPendingSubject);
      
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response,
          timestamp: new Date()
        }]);
        setIsTyping(false);
      }, 1000);
      
    } catch (err) {
      console.error('Error:', err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: { type: 'text', message: 'Sorry, error occurred. Try again.' },
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    'I want to learn Python',
    'Beginner React courses',
    'Intermediate DSA',
    'Web development basics'
  ];

  const uniqueSubjects = [...new Set(notes.map(n => n.subject))];

  const dashboardCards = [
    { 
      title: 'Topics', 
      count: courses.length,
      description: 'Available courses',
      icon: BookOpen, 
      colorBar: 'card-color-bar-blue',
      iconWrapper: 'card-icon-wrapper-blue',
      button: 'card-button-blue',
      action: () => navigate('/topics') 
    },
    { 
      title: 'Study Materials', 
      count: notes.length,
      description: 'Learning resources',
      icon: FileText, 
      colorBar: 'card-color-bar-green',
      iconWrapper: 'card-icon-wrapper-green',
      button: 'card-button-green',
      action: () => {
        setSelectedSubject(null);
        setShowNotes(true);
      }
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-bg">
        <div className="dashboard-orb dashboard-orb-1"></div>
        <div className="dashboard-orb dashboard-orb-2"></div>
        <div className="dashboard-orb dashboard-orb-3"></div>
      </div>

      <nav className="dashboard-nav">
        <div className="nav-container">
          <div className="nav-content">
            <div className="nav-left">
              <div className="logo-section">
                <div className="logo-icon-container">
                  <GraduationCap className="logo-icon" />
                </div>
                <div className="logo-text-container">
                  <h1>EduAdapt</h1>
                  <p>Student Dashboard</p>
                </div>
              </div>
            </div>

            <div className="nav-right">
              <button className="notification-button">
                <Bell className="notification-icon" />
                <span className="notification-badge"></span>
              </button>

              <div className="user-info">
                <div className="user-avatar"><span>S</span></div>
                <div className="user-details">
                  <p>{studentName}</p>
                  <p>{email}</p>
                </div>
              </div>

              <button onClick={handleLogout} className="logout-button">
                <LogOut className="logout-icon" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {!showChatbot && (
        <button className="chatbot-fab" onClick={() => setShowChatbot(true)}>
          <MessageCircle size={24} />
          <span className="chatbot-fab-badge">
            <Sparkles size={12} />
          </span>
        </button>
      )}

      <div className="dashboard-content">
        <div className="content-wrapper">
          <div className="welcome-section">
            <h2 className="welcome-title">Welcome Back, {studentName}! 👋</h2>
            <p className="welcome-subtitle">Ready to continue your learning journey?</p>
          </div>

          {loading && (
            <div className="loading-state">
              <div className="loading-spinner">⏳</div>
              <p>Loading...</p>
            </div>
          )}

          {!loading && uniqueSubjects.length > 0 && (
            <div className="subjects-section">
              <h3 className="subjects-title">📘 Browse by Subject</h3>
              <p className="subjects-subtitle">Click to view materials</p>
              <div className="subject-grid">
                {uniqueSubjects.map((subject, index) => {
                  const subjectNotes = notes.filter(n => n.subject === subject);
                  return (
                    <div
                      key={index}
                      className="subject-card"
                      onClick={() => {
                        setSelectedSubject(subject);
                        setShowNotes(true);
                      }}
                    >
                      <div className="subject-icon">
                        <BookOpen size={28} />
                      </div>
                      <div className="subject-info">
                        <h4>{subject}</h4>
                        <p>{subjectNotes.length} materials</p>
                      </div>
                      <div className="subject-arrow">→</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && notes.length === 0 && (
            <div className="no-materials-state">
              <div className="no-materials-icon">📚</div>
              <h3>No Study Materials Yet</h3>
              <p>Materials will appear here</p>
              <button onClick={fetchAllNotes} className="refresh-button">
                🔄 Refresh
              </button>
            </div>
          )}

          <div className="cards-grid">
            {dashboardCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div key={index} className="dashboard-card" onClick={card.action}>
                  <div className="card-inner">
                    <div className={`card-color-bar ${card.colorBar}`}></div>
                    <div className="card-content">
                      <div className={`card-icon-wrapper ${card.iconWrapper}`}>
                        <Icon className="card-icon" />
                      </div>
                      <div className="card-text-content">
                        <h3 className="card-title">{card.title}</h3>
                        <p className="card-count">{card.count}</p>
                        <p className="card-description">{card.description}</p>
                      </div>
                      <button className={`card-button ${card.button}`}>
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {showChatbot && (
            <div className="chatbot-modal">
              <div className="chatbot-header">
                <div className="chatbot-header-left">
                  <div className="chatbot-avatar">
                    <Bot size={24} />
                  </div>
                  <div>
                    <h3>AI Study Assistant</h3>
                    <p className="chatbot-status">
                      <span className="status-dot"></span>
                      Online
                    </p>
                  </div>
                </div>
                <button className="chatbot-close" onClick={() => setShowChatbot(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="chatbot-messages">
                {messages.map((msg, index) => (
                  <div key={index} className={`message ${msg.role}`}>
                    <div className="message-avatar">
                      {msg.role === 'assistant' ? <Bot size={20} /> : <UserIcon size={20} />}
                    </div>
                    <div className="message-content">
                      {typeof msg.content === 'string' ? (
                        <p>{msg.content}</p>
                      ) : msg.content.type === 'text' ? (
                        <p style={{ whiteSpace: 'pre-line' }}>{msg.content.message}</p>
                      ) : msg.content.type === 'course_recommendation' ? (
                        <div className="course-recommendation">
                          <p style={{ whiteSpace: 'pre-line', marginBottom: '1rem' }}>
                            {msg.content.message}
                          </p>
                          <div className="courses-list">
                            {msg.content.courses.map((course, idx) => (
                              <div key={idx} className="course-card">
                                <div className="course-card-header">
                                  <h4>{course.title}</h4>
                                  <span className="course-platform">{course.platform}</span>
                                </div>
                                <div className="course-card-body">
                                  <p className="course-instructor">👨‍🏫 {course.instructor}</p>
                                  <div className="course-stats">
                                    <span>⭐ {course.rating}</span>
                                    <span>👥 {course.students}</span>
                                    <span className="course-price">{course.price}</span>
                                    {course.duration && <span>⏱️ {course.duration}</span>}
                                  </div>
                                </div>
                                <a 
                                  href={course.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="course-link"
                                >
                                  View Course <ExternalLink size={14} />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      <span className="message-time">
                        {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="message assistant">
                    <div className="message-avatar">
                      <Bot size={20} />
                    </div>
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {messages.length <= 1 && (
                <div className="quick-actions">
                  <p className="quick-actions-label">Quick actions:</p>
                  <div className="quick-actions-grid">
                    {quickActions.map((action, idx) => (
                      <button
                        key={idx}
                        className="quick-action-btn"
                        onClick={() => setInputMessage(action)}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="chatbot-input">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about courses..."
                  disabled={isTyping}
                />
                <button 
                  onClick={handleSendMessage} 
                  disabled={!inputMessage.trim() || isTyping}
                  className="send-button"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          )}

          {showNotes && (
            <div 
              className="notes-modal-overlay"
              onClick={() => {
                setShowNotes(false);
                setSelectedSubject(null);
              }}
            >
              <div className="notes-modal" onClick={(e) => e.stopPropagation()}>
                <div className="notes-modal-header">
                  <div className="notes-header-content">
                    <div className="notes-icon-wrapper">
                      <FileText className="notes-header-icon" />
                    </div>
                    <div>
                      <h2 className="notes-modal-title">
                        {selectedSubject ? `${selectedSubject} Materials` : 'All Materials'}
                      </h2>
                      <p className="notes-modal-subtitle">
                        {selectedSubject 
                          ? `${notes.filter(n => n.subject === selectedSubject).length} materials`
                          : `${notes.length} materials`
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    className="notes-close-button"
                    onClick={() => {
                      setShowNotes(false);
                      setSelectedSubject(null);
                    }}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="notes-modal-body">
                  {notes.length === 0 ? (
                    <div className="notes-empty-state">
                      <div className="empty-state-icon">📚</div>
                      <h3>No Materials</h3>
                    </div>
                  ) : (
                    <>
                      {selectedSubject && (
                        <div className="subject-filter-info">
                          <span>Showing: <strong>{selectedSubject}</strong></span>
                          <button 
                            className="clear-filter-button"
                            onClick={() => setSelectedSubject(null)}
                          >
                            View All
                          </button>
                        </div>
                      )}
                      <div className="notes-grid">
                        {notes
                          .filter(note => !selectedSubject || note.subject === selectedSubject)
                          .map((note) => (
                            <div key={note._id} className="note-card">
                              <div className="note-card-header">
                                <div className="note-file-icon">
                                  <FileText />
                                </div>
                                <span className="note-subject-badge">{note.subject}</span>
                              </div>
                              <div className="note-card-body">
                                <h3 className="note-title">{note.title}</h3>
                                <p className="note-teacher">By Teacher</p>
                              </div>
                              <div className="note-card-footer">
                                <a
                                  href={`http://localhost:5000/uploads/${note.fileUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="note-view-button"
                                  download
                                >
                                  <Download className="w-4 h-4" />
                                  <span>Download</span>
                                </a>
                                <a
                                  href={`http://localhost:5000/uploads/${note.fileUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="note-preview-button"
                                >
                                  <BookOpen className="w-4 h-4" />
                                  <span>View</span>
                                </a>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="dashboard-footer">
            <p className="footer-text">© 2024 EduAdapt • Empowering Education Through Innovation</p>
          </div>
        </div>
      </div>
    </div>
  );
}
