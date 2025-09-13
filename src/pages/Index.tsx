// Update this page (the content is just a fallback if you fail to update the page)

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-gradient-primary">Welcome to CourseLens</h1>
        <p className="text-xl text-muted-foreground mb-8">Your comprehensive course feedback platform</p>
        <div className="space-y-4">
          <p className="text-muted-foreground">This is a fallback page. The main auth page should load at "/"</p>
          <a href="/" className="text-primary underline hover:text-primary/80">
            Go to Authentication →
          </a>
        </div>
      </div>
    </div>
  );
};

export default Index;
