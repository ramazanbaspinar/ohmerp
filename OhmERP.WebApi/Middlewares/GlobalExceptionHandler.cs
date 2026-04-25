using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using OhmERP.Domain.Exceptions;

namespace OhmERP.WebApi.Middlewares;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        _logger.LogError(exception, "Sistem Hatası: {Message}", exception.Message);
        if (exception is BusinessException businessException)
        {
            var businessProblem = new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "İşlem Hatası",
                Detail = businessException.Message,
                Type = "BusinessRuleViolation"
            };
            businessProblem.Extensions.Add("message", businessException.Message);

            httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
            await httpContext.Response.WriteAsJsonAsync(businessProblem, cancellationToken);
            return true;
        }

        if (exception is RelationExistsException relationException)
        {
            var relationProblem = new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Bağlı Kayıt Hatası",
                Detail = relationException.Message,
                Type = "RelationConstraintViolation"
            };
            relationProblem.Extensions.Add("message", relationException.Message);

            httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
            await httpContext.Response.WriteAsJsonAsync(relationProblem, cancellationToken);
            return true;
        }

        if (exception is DbUpdateException dbUpdateException)
        {
            if (dbUpdateException.InnerException is SqlException sqlException)
            {
                string userMessage;
                switch (sqlException.Number)
                {
                    case 547:
                        userMessage = "Seçilen kaydın işlem görmüş hareketleri (bağlı alt kayıtları) bulunmaktadır. Bu kayıt silinemez.";
                        break;
                    case 2601:
                    case 2627:
                        userMessage = "Girmiş olduğunuz Kod veya benzersiz değer daha önceden kullanılmıştır. Lütfen farklı bir değer giriniz.";
                        break;
                    default:
                        userMessage = "Veritabanı işlemi sırasında beklenmeyen bir hata oluştu. Lütfen BT departmanı ile iletişime geçin.";
                        break;
                }

                var dbProblem = new ProblemDetails
                {
                    Status = StatusCodes.Status400BadRequest,
                    Title = "Veritabanı Kısıtlama Hatası",
                    Detail = userMessage,
                    Type = "DatabaseConstraintViolation"
                };
                dbProblem.Extensions.Add("message", userMessage);

                httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
                await httpContext.Response.WriteAsJsonAsync(dbProblem, cancellationToken);
                return true;
            }

            var genericDbProblem = new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Veritabanı Hatası",
                Detail = "Veritabanı işlemi sırasında bir hata oluştu. Lütfen girdiğiniz verileri kontrol ediniz.",
                Type = "DatabaseError"
            };
            genericDbProblem.Extensions.Add("message", genericDbProblem.Detail);

            httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
            await httpContext.Response.WriteAsJsonAsync(genericDbProblem, cancellationToken);
            return true;
        }

        var serverProblem = new ProblemDetails
        {
            Status = StatusCodes.Status500InternalServerError,
            Title = "Sunucu tarafında beklenmeyen bir hata oluştu.",
            Detail = "İşleminiz şu anda gerçekleştirilemiyor. Lütfen BT departmanı ile iletişime geçin.",
            Type = "InternalServerError"
        };

        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await httpContext.Response.WriteAsJsonAsync(serverProblem, cancellationToken);

        return true;
    }
}