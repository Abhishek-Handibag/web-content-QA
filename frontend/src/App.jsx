import React, { useState, useCallback } from "react";
import {
  Container,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  IconButton,
  Alert,
  CircularProgress,
  Box,
  useTheme,
  useMediaQuery,
  Paper,
  Fade,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Language as LanguageIcon,
  ChatBubbleOutline as ChatIcon,
} from "@mui/icons-material";

const WebQA = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  const [urls, setUrls] = useState([""]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    urls: {},
    question: "",
    general: "",
  });

  const isValidUrl = useCallback((urlString) => {
    try {
      const url = new URL(urlString);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, []);

  const hasValidUrls = useCallback(() => {
    return urls.some((url) => url.trim() !== "" && isValidUrl(url));
  }, [urls, isValidUrl]);

  const handleUrlChange = (index, value) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);

    const newErrors = { ...errors };
    delete newErrors.urls[index];
    setErrors(newErrors);

    if (value.trim() !== "" && !isValidUrl(value)) {
      setErrors((prev) => ({
        ...prev,
        urls: {
          ...prev.urls,
          [index]: "Please enter a valid URL (e.g., https://example.com)",
        },
      }));
    }
  };

  const addUrlField = () => {
    setUrls([...urls, ""]);
  };

  const removeUrlField = (index) => {
    const newUrls = urls.filter((_, i) => i !== index);
    if (newUrls.length === 0) newUrls.push("");
    setUrls(newUrls);

    const newErrors = { ...errors };
    delete newErrors.urls[index];
    setErrors(newErrors);
  };

  const validateForm = () => {
    const newErrors = {
      urls: {},
      question: "",
      general: "",
    };
    let isValid = true;

    const validUrls = urls.filter((url) => url.trim() !== "");
    if (validUrls.length === 0) {
      newErrors.general = "Please enter at least one URL";
      isValid = false;
    } else {
      urls.forEach((url, index) => {
        if (url.trim() !== "" && !isValidUrl(url)) {
          newErrors.urls[index] = "Please enter a valid URL (e.g., https://example.com)";
          isValid = false;
        }
      });
    }

    if (!question.trim()) {
      newErrors.question = "Please enter a question";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrors({ urls: {}, question: "", general: "" });
    setAnswer("");

    try {
      const validUrls = urls.filter((url) => url.trim() !== "" && isValidUrl(url));
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setAnswer("This is a sample answer based on the provided URLs.");
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        general: "An error occurred while processing your request",
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: theme.palette.grey[50],
        py: { xs: 2, sm: 4 },
        px: { xs: 2, sm: 3 },
      }}
    >
      <Container maxWidth="md">
        <Typography
          variant={isMobile ? "h4" : "h3"}
          align="center"
          gutterBottom
          sx={{ fontWeight: "bold", color: theme.palette.text.primary }}
        >
          Web Content Q&A
        </Typography>
        
        <Typography
          variant="h6"
          align="center"
          color="textSecondary"
          gutterBottom
          sx={{ mb: 4 }}
        >
          Ask questions about any web content by providing URLs.
        </Typography>

        <Paper
          elevation={2}
          sx={{
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <CardHeader
            sx={{
              bgcolor: theme.palette.background.default,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
            title={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LanguageIcon color="primary" />
                <Typography variant="h6">Add Web Sources</Typography>
              </Box>
            }
            subheader="Enter the URLs of the web pages you'd like to analyze"
          />

          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            {urls.map((url, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  gap: 1,
                  mb: 2,
                  flexDirection: isMobile ? "column" : "row",
                }}
              >
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Enter URL"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  error={Boolean(errors.urls[index])}
                  helperText={errors.urls[index]}
                  size={isMobile ? "small" : "medium"}
                />
                <IconButton
                  onClick={() => removeUrlField(index)}
                  disabled={urls.length === 1}
                  color="error"
                  sx={{
                    alignSelf: isMobile ? "flex-end" : "center",
                    mt: isMobile ? -2 : 0,
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addUrlField}
              fullWidth
              sx={{ mb: 3 }}
            >
              Add Another Source
            </Button>

            {errors.general && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errors.general}
              </Alert>
            )}

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <ChatIcon color="primary" />
                <Typography variant="h6">Ask Your Question</Typography>
              </Box>

              <TextField
                fullWidth
                variant="outlined"
                label="What would you like to know?"
                placeholder="Enter your question"
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  setErrors((prev) => ({ ...prev, question: "" }));
                }}
                error={Boolean(errors.question)}
                helperText={errors.question}
                disabled={!hasValidUrls()}
                size={isMobile ? "small" : "medium"}
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />

              <Button
                variant="contained"
                color="primary"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                onClick={handleSubmit}
                disabled={loading || !hasValidUrls()}
                fullWidth
                size={isMobile ? "medium" : "large"}
              >
                {loading ? "Processing..." : "Submit"}
              </Button>
            </Box>

            {answer && (
              <Fade in>
                <Alert
                  severity="success"
                  sx={{
                    mt: 3,
                    backgroundColor: theme.palette.success.light,
                  }}
                >
                  <Typography variant="body1">{answer}</Typography>
                </Alert>
              </Fade>
            )}
          </CardContent>
        </Paper>
      </Container>
    </Box>
  );
};

export default WebQA;